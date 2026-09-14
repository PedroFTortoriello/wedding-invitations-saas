import Image from "next/image";
import type { WeddingSite } from "@/types/wedding";
import { GiftRegistry } from "@/components/gift/GiftRegistry";
import { GuestForms } from "@/components/templates/shared/GuestForms";
import styles from "./civil-minimalista.module.css";

type CivilMinimalistTemplateProps = {
  wedding: WeddingSite;
};

export function CivilMinimalistTemplate({ wedding }: CivilMinimalistTemplateProps) {
  const [firstName, secondName] = wedding.coupleNames.split(" & ");
  const location = wedding.locations[0];
  const storyImage = wedding.gallery[6]?.src ?? wedding.heroImage;
  const portraitImage = wedding.gallery[1]?.src ?? wedding.heroImage;
  const detailImage = wedding.gallery[7]?.src ?? wedding.heroImage;

  return (
    <main className={styles.template}>
      <section className={styles.hero} aria-label={`Site de casamento de ${wedding.coupleNames}`}>
        <Image
          src={wedding.heroImage}
          alt=""
          width={2400}
          height={1598}
          priority
          className={styles.heroImage}
        />
        <div className={styles.heroShade} />
        <div className={styles.heroNames}>
          <h1>
            <span>{firstName}</span>
            <span>{secondName}</span>
          </h1>
        </div>
        <div className={styles.heroMeta} data-reveal>
          <time dateTime={wedding.weddingDate}>{wedding.weddingDateLabel}</time>
          {location?.city ? <span>{location.city}</span> : null}
        </div>
      </section>

      <section className={styles.story}>
        <div className={styles.storyTitle} data-reveal style={{ transitionDelay: "0ms" }}>
          <p>Nossa</p>
          <h2>História de amor</h2>
        </div>
        <div className={styles.storyImageWrap} data-reveal style={{ transitionDelay: "80ms" }}>
          <Image src={storyImage} alt="História do casal" width={900} height={1100} className={styles.storyImage} />
        </div>
        <article className={styles.storyCopy} data-reveal style={{ transitionDelay: "160ms" }}>
          <p>{wedding.welcomeText}</p>
          <p>
            {wedding.storyMoments[0]?.description} {wedding.storyMoments[1]?.description}
          </p>
        </article>
      </section>

      <section className={styles.splitDark}>
        <div className={styles.portraitPanel}>
          <Image src={portraitImage} alt="Retrato do casal" width={900} height={1200} className={styles.portrait} />
        </div>
        <div className={styles.detailsPanel} data-reveal>
          <p className={styles.eyebrow}>Detalhes da cerimônia</p>
          <h2>{wedding.detailsTitle}</h2>
          <dl>
            <div>
              <dt>Quando</dt>
              <dd>
                {wedding.weddingDateLabel}
                <br />
                {wedding.weddingTime}
              </dd>
            </div>
            <div>
              <dt>Onde</dt>
              <dd>
                {location?.venue}
                <br />
                {location?.city}
              </dd>
            </div>
            <div>
              <dt>Traje</dt>
              <dd>Traje social, tons neutros e elegantes.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className={styles.gallery}>
        <Image
          src={detailImage}
          alt="Detalhe editorial do casal"
          width={900}
          height={1100}
          loading="lazy"
          data-reveal
          style={{ transitionDelay: "0ms" }}
        />
        <article data-reveal style={{ transitionDelay: "90ms" }}>
          <p>Reserve o fim de semana</p>
          <h2>Celebração intimista</h2>
          <span>{wedding.finalText}</span>
        </article>
      </section>

      <section id="presentes" className={styles.gifts}>
        <div className={styles.giftsIntro} data-reveal>
          <p>Presentes</p>
          <h2>Lista de presentes</h2>
          <span>Escolha uma cota e presenteie via Pix — direto na chave do casal, sem taxas.</span>
        </div>
        <GiftRegistry wedding={wedding} variant="civil" />
      </section>

      <GuestForms wedding={wedding} variant="civil" mode="both" sectionId="rsvp" />

      <section className={styles.finalCta}>
        <p>{wedding.monogram}</p>
        <h2 data-reveal>Venha celebrar conosco</h2>
        <div data-reveal style={{ transitionDelay: "120ms" }}>
          <a href={location?.mapUrl ?? "#"} target="_blank" rel="noreferrer">
            Abrir local
          </a>
          <a href="#presentes">Ver lista de presentes</a>
        </div>
      </section>
    </main>
  );
}
