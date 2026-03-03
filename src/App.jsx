import { useEffect, useMemo, useRef, useState } from "react";

const GRID_CELL_SIZE = 60;
const TRAIL_DURATION_MS = 720;

const translations = {
  de: {
    languageLabel: "Sprache",
    contactAria: "Kontaktinformationen",
    contactLabel: "Kontaktieren Sie uns unter dieser E-Mail",
  },
  en: {
    languageLabel: "Language",
    contactAria: "Contact information",
    contactLabel: "Contact us under this email",
  },
  ja: {
    languageLabel: "言語",
    contactAria: "連絡先情報",
    contactLabel: "こちらのメールまでお問い合わせください",
  },
  ko: {
    languageLabel: "언어",
    contactAria: "연락처 정보",
    contactLabel: "이 이메일로 문의해 주세요",
  },
  zh: {
    languageLabel: "语言",
    contactAria: "联系信息",
    contactLabel: "请通过此邮箱联系我们",
  },
};

function App() {
  const [language, setLanguage] = useState("de");
  const [gridSize, setGridSize] = useState({ columns: 1, rows: 1 });
  const [renderTick, setRenderTick] = useState(0);

  const activeTrailRef = useRef(new Map());
  const rafRef = useRef(0);

  useEffect(() => {
    const updateGridSize = () => {
      const columns = Math.max(
        1,
        Math.ceil(window.innerWidth / GRID_CELL_SIZE),
      );
      const rows = Math.max(1, Math.ceil(window.innerHeight / GRID_CELL_SIZE));
      setGridSize({ columns, rows });
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize);
    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const cleanupTimer = window.setInterval(() => {
      const now = Date.now();
      let didDelete = false;

      activeTrailRef.current.forEach((time, index) => {
        if (now - time > TRAIL_DURATION_MS) {
          activeTrailRef.current.delete(index);
          didDelete = true;
        }
      });

      if (didDelete) {
        setRenderTick((value) => value + 1);
      }
    }, 80);

    return () => window.clearInterval(cleanupTimer);
  }, []);

  const queueRerender = () => {
    if (rafRef.current) {
      return;
    }

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      setRenderTick((value) => value + 1);
    });
  };

  const onGridPointerMove = (event) => {
    const { columns, rows } = gridSize;
    if (!columns || !rows) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    const column = Math.min(
      columns - 1,
      Math.max(0, Math.floor((x / bounds.width) * columns)),
    );
    const row = Math.min(
      rows - 1,
      Math.max(0, Math.floor((y / bounds.height) * rows)),
    );
    const index = row * columns + column;

    const now = Date.now();
    activeTrailRef.current.set(index, now);

    queueRerender();
  };

  const text = translations[language];
  const totalCells = gridSize.columns * gridSize.rows;

  const cells = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: totalCells }, (_, index) => {
      const time = activeTrailRef.current.get(index);
      const age = typeof time === "number" ? now - time : TRAIL_DURATION_MS + 1;
      const intensity =
        age < TRAIL_DURATION_MS ? 1 - age / TRAIL_DURATION_MS : 0;

      return (
        <span
          key={index}
          className="grid-cell"
          style={{ "--intensity": intensity.toFixed(3) }}
        />
      );
    });
  }, [totalCells, renderTick]);

  return (
    <main className="page">
      <div className="animated-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
        <div
          className="interactive-grid"
          onPointerMove={onGridPointerMove}
          style={{
            "--grid-columns": gridSize.columns,
            "--grid-rows": gridSize.rows,
          }}
        >
          {cells}
        </div>
      </div>

      <header className="top-bar">
        <div className="brand">Globale Autos</div>
        <label className="language-control" htmlFor="language-select">
          <span>{text.languageLabel}</span>
          <select
            id="language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
            <option value="zh">中文</option>
          </select>
        </label>
      </header>

      <section className="contact-card" aria-label={text.contactAria}>
        <p className="contact-label">{text.contactLabel}</p>
        <a className="contact-email" href="mailto:contact@globalautos.de">
          contact@globalautos.de
        </a>
      </section>
    </main>
  );
}

export default App;
