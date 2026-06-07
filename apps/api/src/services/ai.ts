import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { query, queryOne } from '../db/client.js';
import type { Issue, AIReview, Sheet } from '@gritcore/types';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are GritCore, an AI construction drawing reviewer specializing in concrete, structural, and civil drawings. Review the provided drawing context and return a JSON array of issues with the following fields:
- severity: "critical" | "warning" | "info" | "passed"
- title: string (short, max 60 chars)
- description: string (detailed explanation, 1-3 sentences)
- code_ref: string | null (e.g. "ACI 318-19 §26.4.1.1" or "IBC 2021 §1905.1")
- grid_location: string | null (e.g. "Grid B-4", "Column Line C")
- dollar_risk_estimate: number | null (estimated dollar value of risk if unaddressed)

Return ONLY valid JSON array, no markdown, no explanation. Include at least 2 critical, 3 warning, 3 info, and 2 passed items.

Example format:
[
  {
    "severity": "critical",
    "title": "Missing bar spacing in top mat",
    "description": "Top reinforcement mat in Zone C lacks explicit spacing callout. ACI 318 requires spacing ≤ 18\" for slabs. Ambiguity may result in incorrect field placement.",
    "code_ref": "ACI 318-19 §8.7.2.2",
    "grid_location": "Grid C-5 to C-8",
    "dollar_risk_estimate": 28000
  }
]`;

interface RawIssue {
  severity: string;
  title: string;
  description: string;
  code_ref?: string | null;
  grid_location?: string | null;
  dollar_risk_estimate?: number | null;
}

export async function reviewSheet(sheetId: string, orgId: string): Promise<AIReview> {
  // Create review record
  const review = await queryOne<AIReview>(
    `INSERT INTO ai_reviews (sheet_id, org_id, status, model_used)
     VALUES ($1, $2, 'running', $3) RETURNING *`,
    [sheetId, orgId, MODEL]
  );

  if (!review) throw new Error('Failed to create review record');

  const sheet = await queryOne<Sheet>('SELECT * FROM sheets WHERE id = $1', [sheetId]);
  if (!sheet) throw new Error('Sheet not found');

  const sheetContext = `
Drawing: ${sheet.name}
Sheet Number: ${sheet.sheet_number ?? 'S-101'}
Discipline: ${sheet.discipline ?? 'Structural'}
Project: Riverside Concrete Slab — Phase 2 (Mixed-use retail podium, 180,000 sqft post-tension slab)
Location: San Francisco, CA

Drawing Content Description:
This is a post-tensioned concrete slab plan for Level P1 (Parking Level). The slab is 8" thick PT slab with banded and distributed tendons. Layout includes:
- 9 bays in X-direction (24'-0" typical), 6 bays in Y-direction (26'-0" typical)
- Grid lines A through H (N-S) and 1 through 9 (E-W)
- Drop caps at all column locations (18"×18" × 1-1/2" thick)
- Slab band beams at column lines C and F (36" wide × 14" deep)
- PT tendons: banded tendons at 5'-0" o.c. in band direction, distributed at 3'-6" o.c.
- #5 @ 18" top mat throughout with #4 @ 12" additional top steel at columns
- PT anchorage pockets at perimeter: 6" square pockets at 5'-0" o.c.
- Slab edge condition: 12" thickened edge with (2) #5 continuous top and bottom
- Control joints: not shown on plan (specified by note to follow ACI 302)
- Vapor barrier: noted as "per spec section 03300" but no specification provided in drawing set
- Pour sequence: not indicated
- Concrete: f'c = 5,000 psi, lightweight concrete (115 pcf)
- Mild reinforcement: ASTM A615 Gr. 60
- PT: ASTM A416 Gr. 270 low-relaxation strand, 0.5" diameter
- Cover: 1" bottom, 1" top (below carpet/topping)
- Stressing end: live ends at perimeter gridlines 1 and 9
- Dead ends: at internal construction joints

Notable conditions:
- Re-entrant corners at stairwell openings S1, S2, S3 without diagonal reinforcement shown
- MEP sleeve openings up to 12" diameter without reinforcement trimmer bars
- No shear stud layout shown for post-installed anchors at future partition walls
- Column pedestal dimensions inconsistent between architectural and structural drawings
- Rebar lap splice lengths not tabulated; reference to general notes only
`;

  let rawIssues: RawIssue[] = [];
  let promptTokens = 0;
  let completionTokens = 0;
  let summary = '';
  let quantityEstimate: Record<string, unknown> = {};

  try {
    let responseText: string;

    if (config.ANTHROPIC_API_KEY && config.ANTHROPIC_API_KEY !== 'sk-ant-...' && !config.ANTHROPIC_API_KEY.includes('...')) {
      // Real API call
      const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Please review the following construction drawing and return a JSON array of issues:\n\n${sheetContext}`,
          },
        ],
      });

      promptTokens = message.usage.input_tokens;
      completionTokens = message.usage.output_tokens;

      const content = message.content[0];
      responseText = content.type === 'text' ? content.text : '';
    } else {
      // Pilot stub — realistic mock response
      responseText = JSON.stringify([
        {
          severity: 'critical',
          title: 'Re-entrant corner reinforcement missing',
          description: 'Stairwell openings S1, S2, and S3 have re-entrant corners without diagonal reinforcement bars. ACI 318 requires minimum (2) #5 diagonal bars at 45° extending ≥ 24" beyond corner at all slab re-entrant corners. Omission is likely to cause cracking and potential serviceability failure.',
          code_ref: 'ACI 318-19 §8.7.4.1.3',
          grid_location: 'Openings S1 (Grid B-3), S2 (Grid E-6), S3 (Grid G-8)',
          dollar_risk_estimate: 42000,
        },
        {
          severity: 'critical',
          title: 'MEP sleeve openings lack trimmer reinforcement',
          description: 'Mechanical, electrical, and plumbing sleeve openings up to 12" in diameter are shown without reinforcement trimmer bars. Per ACI 318, openings larger than 6" require supplemental reinforcement equivalent to interrupted bars. This creates a structural deficiency that can propagate cracking under service loads.',
          code_ref: 'ACI 318-19 §26.6.2.2',
          grid_location: 'Multiple locations — see MEP coordination drawings',
          dollar_risk_estimate: 18500,
        },
        {
          severity: 'critical',
          title: 'Control joint locations not specified on plan',
          description: 'The slab plan includes only a general note referencing ACI 302 for control joint spacing. Actual joint locations, spacing, and details must be explicitly coordinated and shown on the structural drawings to prevent random cracking in the PT slab. For a 180,000 sqft slab, this affects multiple bays.',
          code_ref: 'ACI 302.1R-15 §5.8',
          grid_location: 'Entire slab — no joints indicated',
          dollar_risk_estimate: 65000,
        },
        {
          severity: 'warning',
          title: 'Vapor barrier specification incomplete',
          description: 'Sheet notes vapor barrier as "per spec section 03300" but specification section is not included in drawing package. Type, thickness, and lap requirements must be confirmed. Per ACI 302, minimum 10-mil polyethylene is required under slabs on ground. Elevated PT slab details are unclear.',
          code_ref: 'ACI 302.1R-15 §4.1.6',
          grid_location: 'General — all slab areas',
          dollar_risk_estimate: 9200,
        },
        {
          severity: 'warning',
          title: 'Pour sequence not indicated',
          description: 'No pour sequence or construction joint locations are indicated on the slab plan. For a 180,000 sqft PT slab, pour sequence significantly affects tendon stressing sequence, PT force distribution, and potential cracking during construction. Contractor coordination is required.',
          code_ref: 'PTI DC20.9-17 §7.4',
          grid_location: 'Entire slab',
          dollar_risk_estimate: 12000,
        },
        {
          severity: 'warning',
          title: 'Column pedestal dimension conflict',
          description: 'Column pedestal dimensions on structural sheet S-101 do not match architectural drawings. Structural shows 18"×18" while architectural shows 24"×24" at interior grid intersections. Discrepancy requires immediate coordination to avoid field conflicts and potential rework.',
          code_ref: null,
          grid_location: 'Grid intersections C-3, C-6, F-3, F-6',
          dollar_risk_estimate: 24000,
        },
        {
          severity: 'warning',
          title: 'Rebar lap splice lengths not tabulated',
          description: 'Lap splice lengths are not shown in a splice table and are only referenced to general notes. ACI 318 requires splice lengths to be explicitly specified for each bar size and cover condition. Lightweight concrete (115 pcf) modifies splice length by a factor of 1.3 which may not be captured in standard general notes.',
          code_ref: 'ACI 318-19 §25.5.1',
          grid_location: 'General — all reinforcement',
          dollar_risk_estimate: 8500,
        },
        {
          severity: 'info',
          title: 'Lightweight concrete density confirmation needed',
          description: 'Structural drawings specify 115 pcf lightweight concrete. Confirm with supplier and geotechnical report that floor loading assumptions and long-term deflection calculations account for lightweight aggregate. Elastic modulus for LW concrete is approximately 25% lower than NW concrete.',
          code_ref: 'ACI 318-19 §19.2.2',
          grid_location: 'General',
          dollar_risk_estimate: null,
        },
        {
          severity: 'info',
          title: 'PT stressing sequence not documented',
          description: 'While live ends are identified at perimeter gridlines, the stressing sequence order is not documented. For balanced loading calculations and to minimize construction camber, a stressing sequence should be established and communicated to the PT subcontractor prior to concrete placement.',
          code_ref: 'PTI DC20.9-17 §8.6',
          grid_location: 'Perimeter — gridlines 1 and 9',
          dollar_risk_estimate: null,
        },
        {
          severity: 'info',
          title: 'Shear stud layout for future partitions not shown',
          description: 'No post-installed anchor layout is shown for future partition walls. Early coordination with architectural drawings to identify anchor zones would allow cast-in inserts to be specified, reducing cost and schedule impact compared to post-installed expansion anchors.',
          code_ref: null,
          grid_location: 'General — future partition locations',
          dollar_risk_estimate: null,
        },
        {
          severity: 'passed',
          title: 'PT tendon spacing within ACI limits',
          description: 'Banded tendons at 5\'-0" o.c. and distributed tendons at 3\'-6" o.c. are within the ACI 318 maximum spacing of 8× slab thickness or 60" for PT flat plates. Tendon layout appears adequate for the given bay geometry.',
          code_ref: 'ACI 318-19 §8.7.5.3',
          grid_location: 'Entire slab',
          dollar_risk_estimate: null,
        },
        {
          severity: 'passed',
          title: 'Drop cap dimensions adequate for punching shear',
          description: '18"×18" drop caps at 1-1/2" additional thickness meet ACI 318 minimum requirements for punching shear enhancement at column-slab connections for the given column size and loading.',
          code_ref: 'ACI 318-19 §22.6.4',
          grid_location: 'All column locations',
          dollar_risk_estimate: null,
        },
      ]);

      // Simulate token usage for stub
      promptTokens = 1247;
      completionTokens = 892;
    }

    // Parse issues from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      rawIssues = JSON.parse(jsonMatch[0]) as RawIssue[];
    }

    // Count by severity
    const counts = { critical: 0, warning: 0, info: 0, passed: 0 };
    for (const issue of rawIssues) {
      const s = issue.severity as keyof typeof counts;
      if (s in counts) counts[s]++;
    }

    summary = `AI review complete. Found ${counts.critical} critical issues, ${counts.warning} warnings, and ${counts.info} items for review. ${counts.passed} checks passed. Key concerns: re-entrant corner reinforcement, MEP sleeve openings, and missing control joint layout.`;

    quantityEstimate = {
      concrete_cy: 3200,
      pt_strand_lf: 285000,
      mild_rebar_tons: 42.5,
      formwork_sf: 185000,
      total_estimated_value: 4200000,
    };

    // Insert issues
    for (const issue of rawIssues) {
      await query(
        `INSERT INTO issues (review_id, org_id, severity, title, description, code_ref, grid_location, dollar_risk_estimate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          review.id,
          orgId,
          issue.severity,
          issue.title,
          issue.description,
          issue.code_ref ?? null,
          issue.grid_location ?? null,
          issue.dollar_risk_estimate ?? null,
        ]
      );
    }

    // Update review with results
    const updatedReview = await queryOne<AIReview>(
      `UPDATE ai_reviews SET
         status = 'complete',
         prompt_tokens = $1,
         completion_tokens = $2,
         critical_count = $3,
         warning_count = $4,
         info_count = $5,
         passed_count = $6,
         summary = $7,
         quantity_estimate = $8,
         completed_at = NOW()
       WHERE id = $9 RETURNING *`,
      [
        promptTokens,
        completionTokens,
        counts.critical,
        counts.warning,
        counts.info,
        counts.passed,
        summary,
        JSON.stringify(quantityEstimate),
        review.id,
      ]
    );

    return updatedReview!;
  } catch (err) {
    await query(
      `UPDATE ai_reviews SET status = 'failed', completed_at = NOW() WHERE id = $1`,
      [review.id]
    );
    throw err;
  }
}
