import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import Price from '../../components/ui/Price';
import { defaultAdapter, type FinderAnswers, type Recommendation, type CatalogProduct } from './engine';

interface SnackFinderProps {
  products: CatalogProduct[];
  openCart?: () => void;
}

type StepKey = keyof FinderAnswers;

const STEPS: { key: StepKey; question: string; options: { value: string; label: string }[] }[] = [
  {
    key: 'flavor',
    question: 'What kind of flavors do you reach for?',
    options: [
      { value: 'spicy', label: '🌶️ Spicy & bold' },
      { value: 'classic', label: '🧂 Classic & salted' },
      { value: 'sweet', label: '🍯 Sweet' },
      { value: 'surprise', label: '🎲 Surprise me' },
    ],
  },
  {
    key: 'goal',
    question: 'What are you snacking for?',
    options: [
      { value: 'fitness', label: '💪 Fitness & light eating' },
      { value: 'everyday', label: '☕ Everyday munching' },
      { value: 'kids', label: '🎒 Kids & tiffin' },
      { value: 'gifting', label: '🎁 Gifting' },
    ],
  },
  {
    key: 'occasion',
    question: 'When will you crunch the most?',
    options: [
      { value: 'office', label: '💻 Office hours' },
      { value: 'movie', label: '🎬 Movie nights' },
      { value: 'travel', label: '✈️ On the go' },
      { value: 'anytime', label: '🕐 Anytime' },
    ],
  },
  {
    key: 'budget',
    question: 'What budget feels right?',
    options: [
      { value: 'under200', label: 'Under ₹200' },
      { value: '200to400', label: '₹200 – ₹400' },
      { value: 'above400', label: 'Above ₹400' },
      { value: 'any', label: 'No preference' },
    ],
  },
];

/**
 * "Find My Perfect Crunch" — guided finder (Phase 16). Rules-based over the
 * live catalog; recommends only real, in-stock products.
 */
export default function SnackFinder({ products, openCart }: SnackFinderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<FinderAnswers>>({});
  const [result, setResult] = useState<Recommendation | null>(null);
  const [thinking, setThinking] = useState(false);

  const step = STEPS[stepIndex];
  const done = result !== null;

  const choose = async (value: string) => {
    const nextAnswers = { ...answers, [step.key]: value };
    setAnswers(nextAnswers);

    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    setThinking(true);
    try {
      const rec = await defaultAdapter.recommend(nextAnswers as FinderAnswers, products);
      setResult(rec);
    } finally {
      setThinking(false);
    }
  };

  const reset = () => {
    setAnswers({});
    setStepIndex(0);
    setResult(null);
  };

  const handleAdd = (p: CatalogProduct) => {
    if (!user) {
      navigate('/login');
      return;
    }
    addToCart(p as any, 1);
    showToast('Added to cart');
    openCart?.();
  };

  return (
    <section className="home-section snack-finder" aria-labelledby="finder-title">
      <div className="snack-finder-card">
        <p className="ui-section-eyebrow">Not sure where to start?</p>
        <h2 id="finder-title">Find My Perfect Crunch</h2>

        {!done && !thinking && (
          <>
            <div className="finder-progress" aria-hidden="true">
              {STEPS.map((s, i) => (
                <span key={s.key} className={`finder-dot ${i <= stepIndex ? 'on' : ''}`} />
              ))}
            </div>
            <p className="finder-question">
              <span className="finder-step-label">Question {stepIndex + 1} of {STEPS.length}</span>
              {step.question}
            </p>
            <div className="finder-options" role="group" aria-label={step.question}>
              {step.options.map((o) => (
                <button key={o.value} type="button" className="finder-option" onClick={() => choose(o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
            {stepIndex > 0 && (
              <button type="button" className="finder-back" onClick={() => setStepIndex(stepIndex - 1)}>
                ← Back
              </button>
            )}
          </>
        )}

        {thinking && <p className="finder-thinking" role="status">Crunching the numbers…</p>}

        {done && result && (
          <div className="finder-result">
            {result.best ? (
              <>
                <p className="finder-result-label">Your best match</p>
                <div className="finder-best">
                  <div className="finder-best-info">
                    <h3>{result.best.name}</h3>
                    <p className="finder-reason">{result.reason}</p>
                    <Price price={result.best.price} discount={result.best.discount || 0} size="md" />
                  </div>
                  <div className="finder-best-actions">
                    <button className="mk-btn mk-btn-primary" onClick={() => handleAdd(result.best!)}>
                      Add to Cart
                    </button>
                    <button className="mk-btn mk-btn-ghost" onClick={() => navigate(`/products/${result.best!._id}`)}>
                      View Details
                    </button>
                  </div>
                </div>

                {result.alternatives.length > 0 && (
                  <>
                    <p className="finder-result-label">Also worth a crunch</p>
                    <ul className="finder-alts">
                      {result.alternatives.map((p) => (
                        <li key={p._id}>
                          <button type="button" onClick={() => navigate(`/products/${p._id}`)}>
                            <span>{p.name}</span>
                            <Price price={p.price} discount={p.discount || 0} size="sm" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <p className="finder-reason">{result.reason}</p>
            )}
            <button type="button" className="finder-back" onClick={reset}>↺ Start over</button>
          </div>
        )}
      </div>
    </section>
  );
}
