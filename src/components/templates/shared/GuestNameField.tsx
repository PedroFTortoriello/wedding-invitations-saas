"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { isDemoWedding } from "@/lib/demo-id";
import { normalizeName } from "@/lib/public-forms";
import styles from "./guest-forms.module.css";

/**
 * Campo de nome do RSVP com BUSCA na lista do casal (autocomplete). O convidado
 * digita e escolhe o próprio nome — resolve homônimos e evita confirmar o nome
 * errado. É um drop-in: renderiza um <input name="name"> de verdade (o FormData
 * dos formulários continua funcionando), embrulhado num container relativo, então
 * as regras `.field input` de cada modelo seguem valendo. O dropdown é claro e
 * legível sobre qualquer skin (claro ou escuro) e usa a --font-sans do modelo.
 */

const MIN_QUERY = 2;

/** Lista fictícia da demo (/modelo/*): a busca filtra aqui e não chama a API. */
const DEMO_GUEST_NAMES = ["Ana Souza", "Bruno Lima", "Carla Dias"];

type Props = {
  slug: string;
  /** Id do casamento: no casamento de demonstração a busca é local (sem fetch). */
  weddingId?: string;
  /** Nome do campo no form (o backend lê `name`). */
  name?: string;
  placeholder?: string;
  required?: boolean;
  /** Classe extra do input (os modelos costumam estilizar via `.field input`). */
  className?: string;
  defaultValue?: string;
  onPick?: (name: string) => void;
};

export function GuestNameField({
  slug,
  weddingId,
  name = "name",
  placeholder = "Digite para buscar seu nome",
  required,
  className,
  defaultValue = "",
  onPick
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const skipSearch = useRef(false); // não rebusca logo após escolher da lista
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const demo = isDemoWedding(weddingId);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    const q = value.trim();
    const controller = new AbortController();
    // Todo setState roda no callback assíncrono (nunca síncrono no corpo do
    // efeito): consulta curta limpa a lista; senão, busca com debounce.
    const timer = setTimeout(
      () => {
        if (q.length < MIN_QUERY) {
          setItems([]);
          setOpen(false);
          setSearched(false);
          return;
        }
        if (demo) {
          const target = normalizeName(q);
          setItems(DEMO_GUEST_NAMES.filter((n) => normalizeName(n).includes(target)));
          setActive(-1);
          setSearched(true);
          setOpen(true);
          return;
        }
        setLoading(true);
        fetch(`/api/rsvp/search?slug=${encodeURIComponent(slug)}&q=${encodeURIComponent(q)}`, {
          signal: controller.signal
        })
          .then((res) => res.json())
          .then((json: { names?: string[] }) => {
            setItems(Array.isArray(json.names) ? json.names : []);
            setActive(-1);
            setSearched(true);
            setOpen(true);
          })
          .catch(() => {
            /* abortado ou rede: mantém estado anterior */
          })
          .finally(() => setLoading(false));
      },
      q.length < MIN_QUERY ? 0 : 200
    );

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value, slug, demo]);

  // Fecha ao clicar fora.
  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pick(picked: string) {
    skipSearch.current = true;
    setValue(picked);
    setItems([]);
    setOpen(false);
    setActive(-1);
    onPick?.(picked);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open && items.length) setOpen(true);
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter" && open && active >= 0 && items[active]) {
      event.preventDefault();
      pick(items[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showPanel = open && (loading || items.length > 0 || (searched && value.trim().length >= MIN_QUERY));

  return (
    <div ref={boxRef} style={WRAP}>
      <input
        name={name}
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className={className ? `${styles.nameInput} ${className}` : styles.nameInput}
        style={INPUT}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => {
          if (items.length) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {showPanel ? (
        <ul id={listId} role="listbox" style={PANEL}>
          {loading && !items.length ? (
            <li style={NOTE}>Buscando…</li>
          ) : items.length ? (
            items.map((n, i) => (
              <li
                key={n}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                style={{ ...OPTION, ...(i === active ? OPTION_ACTIVE : null) }}
                onMouseDown={(event) => {
                  event.preventDefault(); // não deixa o input perder foco antes do clique
                  pick(n);
                }}
                onMouseEnter={() => setActive(i)}
              >
                {n}
              </li>
            ))
          ) : (
            <li style={NOTE}>
              {demo
                ? `Na demonstração, experimente: ${DEMO_GUEST_NAMES.join(", ")}.`
                : "Nenhum nome encontrado. Confira como está no convite."}
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

const WRAP: CSSProperties = { position: "relative", width: "100%" };
const INPUT: CSSProperties = { width: "100%", boxSizing: "border-box" };
const PANEL: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  zIndex: 60,
  margin: 0,
  padding: 4,
  listStyle: "none",
  maxHeight: 240,
  overflowY: "auto",
  background: "#ffffff",
  color: "#1a1e15",
  border: "1px solid rgba(20, 20, 15, 0.14)",
  borderRadius: 12,
  boxShadow: "0 18px 44px rgba(0, 0, 0, 0.2)",
  // O painel fica dentro do <label> do modelo: não herda caixa alta nem peso dele.
  fontFamily: "var(--font-sans)",
  fontWeight: 400,
  letterSpacing: "normal",
  textTransform: "none"
};
const OPTION: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: "0.95rem",
  lineHeight: 1.3
};
const OPTION_ACTIVE: CSSProperties = { background: "rgba(20, 20, 15, 0.07)" };
const NOTE: CSSProperties = { padding: "10px 12px", fontSize: "0.85rem", color: "#6b6b60" };
