import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faClockRotateLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
import { getProductSuggestions } from '../../api/productApi';
import { formatPrice } from '../../utils/formatters';

interface Suggestion {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  category?: string;
}

interface SearchBarProps {
  onNavigated?: () => void;   // close menus etc. after a navigation
  autoFocus?: boolean;
  compact?: boolean;          // mobile-menu variant
}

const RECENT_KEY = 'mk_recent_searches';
const MAX_RECENT = 5;

const readRecent = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

const saveRecent = (term: string) => {
  if (typeof window === 'undefined') return;
  try {
    const next = [term, ...readRecent().filter((t) => t !== term)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* quota — ignore */
  }
};

/**
 * Layer B search: live product suggestions, recent searches, full keyboard
 * navigation (↑ ↓ Enter Esc), loading and empty states.
 */
export default function SearchBar({ onNavigated, autoFocus = false, compact = false }: SearchBarProps) {
  const navigate = useNavigate();
  const listboxId = useId();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Debounced live suggestions
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await getProductSuggestions(q);
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    if (typeof window === 'undefined' || !open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.document.addEventListener('mousedown', onDown);
    return () => window.document.removeEventListener('mousedown', onDown);
  }, [open]);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      setActiveIndex(-1);
      setQuery('');
      setSuggestions([]);
      navigate(path);
      onNavigated?.();
    },
    [navigate, onNavigated]
  );

  const submitTerm = useCallback(
    (term: string) => {
      const t = term.trim();
      if (!t) return;
      saveRecent(t);
      go(`/products?search=${encodeURIComponent(t)}`);
    },
    [go]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      go(`/products/${suggestions[activeIndex]._id}`);
    } else {
      submitTerm(query);
    }
  };

  const showRecent = open && query.trim().length < 2 && recent.length > 0;
  const showSuggestions = open && query.trim().length >= 2;
  const showEmpty = showSuggestions && !loading && suggestions.length === 0;
  const panelVisible = showRecent || showSuggestions;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className={`searchbar ${compact ? 'searchbar-compact' : ''}`} ref={rootRef}>
      <form role="search" className="searchbar-form" onSubmit={handleSubmit}>
        <FontAwesomeIcon icon={faSearch} className="searchbar-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className="searchbar-input"
          placeholder="Search makhana, flavors, gift boxes…"
          value={query}
          role="combobox"
          aria-expanded={panelVisible}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label="Search products"
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => {
            setRecent(readRecent());
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {query && (
          <button
            type="button"
            className="searchbar-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
        <button type="submit" className="searchbar-submit">Search</button>
      </form>

      {panelVisible && (
        <div className="searchbar-panel" id={listboxId}>
          {showRecent && (
            <>
              <p className="searchbar-panel-label">Recent searches</p>
              <ul className="searchbar-list" role="listbox" aria-label="Recent searches">
                {recent.map((term) => (
                  <li key={term} role="option" aria-selected="false">
                    <button type="button" onClick={() => submitTerm(term)}>
                      <FontAwesomeIcon icon={faClockRotateLeft} aria-hidden="true" />
                      <span className="suggestion-name">{term}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {showSuggestions && loading && (
            <p className="searchbar-panel-state" role="status">Searching…</p>
          )}

          {showEmpty && (
            <p className="searchbar-panel-state" role="status">
              No matches for “{query.trim()}”. Try “classic” or “gift box”.
            </p>
          )}

          {showSuggestions && !loading && suggestions.length > 0 && (
            <ul className="searchbar-list" role="listbox" aria-label="Product suggestions">
              {suggestions.map((s, i) => (
                <li key={s._id} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    className={i === activeIndex ? 'active' : ''}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => go(`/products/${s._id}`)}
                  >
                    <span className="suggestion-name">{s.name}</span>
                    {s.category && <span className="suggestion-cat">{s.category}</span>}
                    <span className="suggestion-price">
                      {formatPrice(s.discount ? (s.price * (100 - s.discount)) / 100 : s.price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
