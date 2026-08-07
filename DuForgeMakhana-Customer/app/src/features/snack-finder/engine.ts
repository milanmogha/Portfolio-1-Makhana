// "Find My Perfect Crunch" — recommendation engine (Phase 16).
// v1 is rules-based over the REAL catalog (no external AI APIs, no fabricated
// products). The adapter interface lets a local/self-hosted model replace the
// rules later without touching the UI.

export interface FinderAnswers {
  flavor: 'spicy' | 'classic' | 'sweet' | 'surprise';
  goal: 'fitness' | 'everyday' | 'kids' | 'gifting';
  occasion: 'office' | 'movie' | 'travel' | 'anytime';
  budget: 'under200' | '200to400' | 'above400' | 'any';
}

export interface CatalogProduct {
  _id: string;
  name: string;
  category?: string;
  subCategory?: string;
  price: number;
  discount?: number;
  stock?: number;
  rating?: { average?: number; count?: number };
}

export interface Recommendation {
  best: CatalogProduct | null;
  reason: string;
  alternatives: CatalogProduct[];
}

export interface RecommendationAdapter {
  recommend(answers: FinderAnswers, catalog: CatalogProduct[]): Promise<Recommendation>;
}

const finalPrice = (p: CatalogProduct) =>
  p.discount ? (p.price * (100 - p.discount)) / 100 : p.price;

const inBudget = (p: CatalogProduct, budget: FinderAnswers['budget']) => {
  const price = finalPrice(p);
  switch (budget) {
    case 'under200': return price < 200;
    case '200to400': return price >= 200 && price <= 400;
    case 'above400': return price > 400;
    default: return true;
  }
};

/** Deterministic, explainable scoring over the live catalog. */
export class RulesAdapter implements RecommendationAdapter {
  async recommend(answers: FinderAnswers, catalog: CatalogProduct[]): Promise<Recommendation> {
    const inStock = catalog.filter((p) => (p.stock ?? 0) > 0);

    const scored = inStock.map((p) => {
      const cat = (p.category || '').toUpperCase();
      const name = (p.name || '').toLowerCase();
      let score = 0;
      const reasons: string[] = [];

      // Flavor preference → category / name signals
      if (answers.flavor === 'spicy' && (cat.includes('FLAVORED') || /peri|masala|chilli|chili|spicy|pudina/.test(name))) {
        score += 3; reasons.push('matches your spicy pick');
      }
      if (answers.flavor === 'classic' && (cat.includes('PLAIN') || /classic|salted|plain/.test(name))) {
        score += 3; reasons.push('a clean classic crunch');
      }
      if (answers.flavor === 'sweet' && /caramel|chocolate|sweet/.test(name)) {
        score += 3; reasons.push('on the sweeter side');
      }
      if (answers.flavor === 'surprise') score += 1;

      // Goal
      if (answers.goal === 'fitness' && (cat.includes('PLAIN') || /lite|low|plain/.test(name))) {
        score += 2; reasons.push('light and simple for fitness goals');
      }
      if (answers.goal === 'gifting' && cat.includes('GIFT')) {
        score += 4; reasons.push('made for gifting');
      }
      if (answers.goal === 'kids' && /caramel|cheese|sweet/.test(name)) {
        score += 2; reasons.push('kid-approved flavor');
      }
      if (answers.goal === 'everyday' && cat.includes('MIX')) {
        score += 1.5; reasons.push('an easy everyday mix');
      }

      // Occasion — travel/office favour mixes; movie night favours flavored
      if (answers.occasion === 'travel' && cat.includes('MIX')) score += 1;
      if (answers.occasion === 'office' && (cat.includes('MIX') || cat.includes('PLAIN'))) score += 1;
      if (answers.occasion === 'movie' && cat.includes('FLAVORED')) score += 1;

      // Budget fit
      if (inBudget(p, answers.budget)) {
        score += 2;
      } else {
        score -= 2;
      }

      // Social proof
      const avg = p.rating?.average || 0;
      const count = p.rating?.count || 0;
      score += Math.min(avg / 2, 2.5) + Math.min(count / 20, 1.5);
      if (avg >= 4 && count >= 3) reasons.push(`rated ${avg.toFixed(1)}★ by customers`);

      return { p, score, reasons };
    });

    scored.sort((a, b) => b.score - a.score);
    const [top, ...rest] = scored;

    if (!top || top.score <= 0) {
      return {
        best: null,
        reason: 'We could not find a confident match — browse the full range instead.',
        alternatives: inStock.slice(0, 3),
      };
    }

    return {
      best: top.p,
      reason: top.reasons.length
        ? `Picked because it ${top.reasons.slice(0, 2).join(' and ')}.`
        : 'The strongest overall match in the current catalog.',
      alternatives: rest.slice(0, 3).map((s) => s.p),
    };
  }
}

export const defaultAdapter: RecommendationAdapter = new RulesAdapter();
