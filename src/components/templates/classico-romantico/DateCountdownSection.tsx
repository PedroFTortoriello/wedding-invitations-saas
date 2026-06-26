"use client";

import { useEffect, useMemo, useState } from "react";
import type { WeddingSite } from "@/types/wedding";
import styles from "./classic-romantic.module.css";

type DateCountdownSectionProps = {
  wedding: WeddingSite;
};

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const pad = (value: number) =>
  String(value).padStart(2, "0");

function getCountdown(target: number): CountdownState {
  const remaining = Math.max(
    0,
    target - Date.now()
  );

  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor(
      (remaining % 86400000) / 3600000
    ),
    minutes: Math.floor(
      (remaining % 3600000) / 60000
    ),
    seconds: Math.floor(
      (remaining % 60000) / 1000
    )
  };
}

export function DateCountdownSection({
  wedding
}: DateCountdownSectionProps) {
  const target = useMemo(
    () =>
      new Date(wedding.weddingDate).getTime(),
    [wedding.weddingDate]
  );

  // null until mounted on the client — avoids an SSR/hydration mismatch on the
  // time-dependent countdown (the section renders nothing on the server).
  const [countdown, setCountdown] =
    useState<CountdownState | null>(null);

  useEffect(() => {
    const update = () => setCountdown(getCountdown(target));
    update();

    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, [target]);

  if (!countdown) {
    return null;
  }

  return (
    <section
      className={styles.event}
      id="event"
    >
      <div
        className={styles["flower-field"]}
        aria-hidden="true"
      >
        {[
          "10%",
          "18%",
          "31%",
          "66%",
          "78%",
          "91%"
        ].map((x, index) => (
          <span
            key={x}
            style={
              {
                "--x": x,
                "--d": `${index * 0.7}s`
              } as React.CSSProperties
            }
          >
            *
          </span>
        ))}
      </div>

      <p>
        reserve esta noite para estar perto
      </p>

      <h2>{wedding.weddingDateLabel}</h2>

      <div
        className={styles.countdown}
        aria-label="Contagem regressiva para o casamento"
      >
        <div>
          <strong>{countdown.days}</strong>
          <span>dias</span>
        </div>

        <div>
          <strong>
            {pad(countdown.hours)}
          </strong>
          <span>horas</span>
        </div>

        <div>
          <strong>
            {pad(countdown.minutes)}
          </strong>
          <span>minutos</span>
        </div>

        <div>
          <strong>
            {pad(countdown.seconds)}
          </strong>
          <span>segundos</span>
        </div>
      </div>
    </section>
  );
}