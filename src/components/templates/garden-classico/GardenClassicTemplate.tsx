
"use client";

import { useState } from "react";
import Image from "next/image";
import type { WeddingSite } from "@/types/wedding";
import styles from "./garden-classico.module.css";

type GardenClassicTemplateProps = {
  wedding: WeddingSite;
};

const schedule = [
  ["17:00", "Fotos de boas-vindas e coquetéis"],
  ["18:00", "Cerimônia no jardim"],
  ["19:00", "Jantar sob luzes suaves"],
  ["21:00", "Dança e brinde da noite"]
];

export function GardenClassicTemplate({
  wedding
}: GardenClassicTemplateProps) {
  const [openGifts, setOpenGifts] = useState(false);

  const location = wedding.locations[0];

  const gallery = [
    wedding.heroImage,
    wedding.gallery[3]?.src,
    wedding.gallery[4]?.src
  ].filter(Boolean);

  const activeGifts = wedding.gifts.filter(
    (gift) => gift.active
  );

  return (
    <main className={styles.template}>
      <section
        className={styles.hero}
        aria-label={`Casamento no jardim de ${wedding.coupleNames}`}
      >
        <Image
          src="/assets/canva-garden/hero-garden.jpg"
          alt=""
          width={1600}
          height={2400}
          priority
          className={styles.heroImage}
        />

        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <h1>{wedding.coupleNames}</h1>

          <p>Vão se casar</p>

          <a href="#confirmacao">
            Confirmar presença
          </a>
        </div>

        <div className={styles.heroMeta}>
          <time dateTime={wedding.weddingDate}>
            {wedding.weddingDateLabel},{" "}
            {wedding.weddingTime}
          </time>

          <span>
            {location?.venue ??
              "Local do jardim"}
          </span>
        </div>
      </section>

      <section className={styles.about}>
        <div className={styles.aboutImage}>
          <Image
            src={wedding.footerImage}
            alt="Foto do casal"
            width={900}
            height={1200}
          />
        </div>

        <article>
          <p>O COMEÇO</p>

          <h2>DO NOSSO PARA SEMPRE</h2>

          <span>{wedding.welcomeText}</span>

          <span>
            {
              wedding.storyMoments[0]
                ?.description
            }
          </span>
        </article>
      </section>

      <section className={styles.photoBreak}>
        <Image
          src={
            wedding.locations[0]?.image ??
            wedding.heroImage
          }
          alt="Local do casamento"
          width={1600}
          height={1067}
        />
      </section>

      <section className={styles.program}>
        <div>
          <p>Programação</p>

          <h2>
            Celebração no jardim
          </h2>
        </div>

        <ul>
          {schedule.map(([time, label]) => (
            <li key={time}>
              <strong>{time}</strong>

              <span>{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.details}>
        <article>
          <p>Detalhes</p>

          <h2>
            {location?.city ??
              "Indaiatuba, SP"}
          </h2>

          <span>{location?.note}</span>

          <a
            href={location?.mapUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
          >
            Abrir mapa
          </a>
        </article>

        <div className={styles.gallery}>
          {gallery.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Galeria ${index + 1}`}
              width={720}
              height={960}
            />
          ))}
        </div>
      </section>

      <section
        id="presentes"
        className={styles.gifts}
      >
        <article>
          <p>Presentes</p>

          <h2>Lista de presentes</h2>

          <span>
            Escolha uma sugestão especial
            para o casal.
          </span>

          <button
            type="button"
            className={styles.giftsButton}
            onClick={() =>
              setOpenGifts(true)
            }
          >
            Ver lista completa
          </button>
        </article>

        <div className={styles.giftList}>
          {activeGifts
            .slice(0, 4)
            .map((gift) => (
              <a
                key={gift.id}
                href={gift.link}
                target={
                  gift.link.startsWith("#")
                    ? undefined
                    : "_blank"
                }
                rel={
                  gift.link.startsWith("#")
                    ? undefined
                    : "noopener noreferrer"
                }
              >
                {gift.image ? (
                  <Image
                    src={gift.image}
                    alt=""
                    width={320}
                    height={220}
                  />
                ) : null}

                <div>
                  <strong>
                    {gift.title}
                  </strong>

                  <p>
                    {gift.description}
                  </p>
                </div>

                <span>{gift.price}</span>
              </a>
            ))}
        </div>
      </section>

      {openGifts && (
        <div
          className={
            styles.giftsModalOverlay
          }
          onClick={() =>
            setOpenGifts(false)
          }
        >
          <div
            className={styles.giftsModal}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div
              className={
                styles.giftsModalHeader
              }
            >
              <div>
                <p>Presentes</p>

                <h3>
                  Lista completa
                </h3>
              </div>

              <button
                type="button"
                className={
                  styles.closeModal
                }
                onClick={() =>
                  setOpenGifts(false)
                }
              >
                Fechar
              </button>
            </div>


<div className={styles.modalGiftList}>
  {activeGifts.map((gift) => (
    <a
      key={gift.id}
      href={gift.link}
      target={
        gift.link.startsWith("#")
          ? undefined
          : "_blank"
      }
      rel={
        gift.link.startsWith("#")
          ? undefined
          : "noopener noreferrer"
      }
    >
      {gift.image ? (
        <Image
          src={gift.image}
          alt=""
          width={320}
          height={320}
        />
      ) : null}

      <div>
        <strong>{gift.title}</strong>

        <p>
          {gift.description.length > 70
            ? `${gift.description.slice(0, 70)}...`
            : gift.description}
        </p>
      </div>

      <span>{gift.price}</span>
    </a>
  ))}
</div>


          </div>
        </div>
      )}

      <section
        id="confirmacao"
        className={styles.rsvp}
      >
        <p>{wedding.monogram}</p>

        <h2>
          Esperamos você para celebrar
          conosco
        </h2>

        <a href="#presentes">
          Ver lista de presentes
        </a>
      </section>
    </main>
  );
}

