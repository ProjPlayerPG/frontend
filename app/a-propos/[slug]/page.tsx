import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AboutPageShell from '@/components/about/aboutPageShell'

type PageProps = {
  params: Promise<{ slug: string }>
}

const pageMetadata: Record<string, { title: string; description: string }> = {
  'guide-rpg': {
    title: 'Comment fonctionne le guide RPG',
    description: "Une explication simple du fonctionnement de l'assistant de recommandation PlayerPG.",
  },
  glossaire: {
    title: 'Comment fonctionne le glossaire',
    description: 'Une explication simple du glossaire participatif de PlayerPG.',
  },
  faq: {
    title: 'Questions fréquentes',
    description: 'Les réponses aux questions les plus courantes sur PlayerPG.',
  },
  'donnees-jeux': {
    title: 'Données de jeu',
    description: 'La provenance et les choix éditoriaux des données de jeu sur PlayerPG.',
  },
  'regles-communaute': {
    title: 'Règles de la communauté',
    description: 'Quelques règles simples pour garder PlayerPG accueillant et utile.',
  },
  confidentialite: {
    title: 'Protection des données',
    description: 'Les données utilisées par PlayerPG et les choix faits pour les protéger.',
  },
  conditions: {
    title: "Conditions d'utilisation",
    description: "Le cadre d'utilisation de PlayerPG, expliqué simplement.",
  },
  contact: {
    title: 'Contactez-nous',
    description: 'Comment contacter PlayerPG.',
  },
}

export function generateStaticParams() {
  return Object.keys(pageMetadata).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const metadata = pageMetadata[slug]

  if (!metadata) return {}

  return {
    title: `${metadata.title} — PlayerPG`,
    description: metadata.description,
  }
}

function GuideRpgPage() {
  return (
    <AboutPageShell
      currentSlug="guide-rpg"
      eyebrow="Un coup de pouce, pas une conversation"
      title="Comment fonctionne le guide RPG ?"
      introduction="Tu décris le RPG que tu cherches. PlayerPG comprend les éléments importants de ta demande, trouve des jeux qui peuvent correspondre et explique brièvement pourquoi ils ont été retenus."
    >
      <section>
        <h2>Ce qui se passe après ta demande</h2>
        <ol>
          <li>PlayerPG repère tes envies : ambiance, période, type de combat, licence ou jeux de référence.</li>
          <li>Une sélection de RPG correspondants est récupérée depuis les données disponibles.</li>
          <li>Le modèle Mistral choisit uniquement parmi cette sélection et rédige une courte raison pour chaque proposition.</li>
        </ol>
        <p>
          Le guide ne peut donc pas inventer librement un titre. Les jeux cités comme références, les contenus adultes et, si tu es connecté, les jeux déjà dans tes favoris sont écartés des résultats.
        </p>
      </section>

      <section>
        <h2>Pourquoi commencer par « Je veux » ?</h2>
        <p>
          Le guide n&apos;est pas une messagerie : il répond à une demande unique. Le début de phrase est donc déjà affiché dans le champ et tu n&apos;as plus qu&apos;à le compléter. Cela aide à formuler une envie claire et évite d&apos;envoyer par erreur un message que le guide ne saurait pas traiter.
        </p>
      </section>

      <section>
        <h2>Quelles informations sont utilisées ?</h2>
        <p>
          Ta demande est envoyée au service de recommandation avec une liste de jeux candidats. Si tu es connecté, tes favoris servent à éviter les doublons et donnent un léger indice sur les mécaniques, thèmes ou genres que tu apprécies. Ta demande reste toujours prioritaire pour ne pas t&apos;enfermer dans tes goûts passés. Ton adresse e-mail et ton pseudo ne sont pas inclus dans la demande envoyée au modèle d&apos;IA.
        </p>
        <p>
          PlayerPG ne conserve pas actuellement ton historique de demandes sur son serveur. La dernière recherche et ses résultats restent enregistrés dans ton navigateur afin que tu puisses ouvrir une fiche puis revenir sans tout perdre.
        </p>
      </section>

      <section>
        <h2>Et ses limites ?</h2>
        <p>
          Une recommandation reste une piste, pas une vérité. Le guide peut mal comprendre une nuance ou s&apos;appuyer sur une fiche incomplète. Les réponses sont générées automatiquement et méritent toujours ton regard critique.
        </p>
      </section>

      <aside className="about-note">
        <p>
          PlayerPG indique clairement quand une recommandation est produite avec une IA. Cette transparence s&apos;inscrit dans l&apos;esprit du règlement européen sur l&apos;IA, sans transformer cette page en texte juridique.
        </p>
      </aside>
    </AboutPageShell>
  )
}

function GlossaryInfoPage() {
  return (
    <AboutPageShell
      currentSlug="glossaire"
      eyebrow="Des mots expliqués par des humains"
      title="Comment fonctionne le glossaire ?"
      introduction="Le glossaire sert à expliquer les mots du RPG sans demander de connaître tout le jargon avant de commencer. Une définition courte pour comprendre vite, puis davantage de détails pour les curieux."
    >
      <section>
        <h2>Tout le monde peut aider</h2>
        <p>
          Une personne connectée peut proposer un terme, une explication, des sources et quelques jeux pour l&apos;illustrer. La proposition n&apos;est pas publiée immédiatement : elle passe d&apos;abord par une relecture.
        </p>
      </section>

      <section>
        <h2>Pourquoi une relecture ?</h2>
        <p>
          Pas pour rendre les textes scolaires. Elle sert surtout à éviter les doublons, vérifier que la définition est compréhensible et s&apos;assurer que les exemples aident vraiment. Si quelque chose doit être corrigé, l&apos;auteur reçoit une notification.
        </p>
      </section>

      <aside className="about-note">
        <p>
          Une définition peut évoluer. Le vocabulaire du jeu vidéo vit avec les joueurs, les studios et les communautés : le glossaire aussi.
        </p>
      </aside>

      <Link href="/glossaire" className="about-primary-link">
        Explorer le glossaire
        <span aria-hidden="true">→</span>
      </Link>
    </AboutPageShell>
  )
}

const faqItems = [
  {
    question: 'PlayerPG est-il réservé aux spécialistes du RPG ?',
    answer: "Non. Le site est justement pensé pour pouvoir commencer sans connaître tous les sous-genres ni tout leur vocabulaire.",
  },
  {
    question: 'Faut-il un compte pour utiliser PlayerPG ?',
    answer: "Non pour consulter les jeux et le glossaire. Un compte est nécessaire pour enregistrer des favoris, proposer un terme et recevoir les notifications associées.",
  },
  {
    question: 'Pourquoi un jeu manque-t-il ?',
    answer: "Les fiches viennent d’IGDB et PlayerPG applique ensuite ses propres filtres. Une fiche peut donc manquer, être incomplète ou ne pas encore correspondre aux critères du catalogue.",
  },
  {
    question: "Est-ce qu'un humain écrit les recommandations du guide ?",
    answer: "Non. Elles sont générées automatiquement à partir de ta demande et d’une sélection de jeux existants. PlayerPG explique plus précisément ce mécanisme sur la page du guide RPG.",
  },
  {
    question: 'Puis-je supprimer mon compte et mes données ?',
    answer: "Oui. La suppression est disponible depuis le profil et retire le compte ainsi que les données qui lui sont rattachées.",
  },
]

function FaqPage() {
  return (
    <AboutPageShell
      currentSlug="faq"
      eyebrow="Les réponses sans détour"
      title="Questions fréquentes"
      introduction="Une question simple mérite une réponse simple. Cette page grandira au fil des retours et des nouvelles fonctionnalités de PlayerPG."
    >
      <div className="grid gap-3">
        {faqItems.map((item) => (
          <details key={item.question} className="group rounded-[1.2rem] border border-[var(--line)] bg-white/[0.025] p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-[var(--foreground)]">
              {item.question}
              <span className="text-xl text-[var(--accent)] transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-4 pr-8 text-sm leading-7 text-[var(--muted)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </AboutPageShell>
  )
}

function GameDataPage() {
  return (
    <AboutPageShell
      currentSlug="donnees-jeux"
      eyebrow="La source derrière les fiches"
      title="Données de jeu"
      introduction="Les noms, dates, images et autres informations visibles sur les fiches viennent d'IGDB, une base de données consacrée au jeu vidéo. PlayerPG les organise ensuite autour du RPG."
    >
      <section>
        <h2>Ce que PlayerPG ajoute</h2>
        <p>
          Le catalogue conserve les jeux identifiés comme RPG et écarte notamment les extensions, lots, mods et mises à jour pour privilégier les jeux principaux. Certaines descriptions sont traduites en français afin de rendre les fiches plus accessibles.
        </p>
      </section>

      <section>
        <h2>Le choix concernant les jeux adultes</h2>
        <p>
          Les jeux classés « Adults Only » ainsi que les titres repérés comme pornographiques, érotiques ou sexuellement explicites sont retirés des résultats PlayerPG. Ce filtre s&apos;applique au catalogue comme aux recommandations du guide RPG.
        </p>
        <p>
          Un filtre automatique n&apos;est jamais parfait. Une fiche mal classée ou trop peu renseignée peut passer entre les mailles, tandis qu&apos;un jeu peut être écarté à tort. Ces cas peuvent être signalés à PlayerPG.
        </p>
      </section>

      <section>
        <h2>Une information semble incorrecte ?</h2>
        <p>
          La donnée d&apos;origine peut être corrigée directement sur IGDB. Lorsqu&apos;une modification y est validée, elle pourra ensuite être reflétée sur PlayerPG.
        </p>
      </section>

      <a href="https://www.igdb.com/" target="_blank" rel="noreferrer" className="about-primary-link">
        Découvrir IGDB
        <span aria-hidden="true">↗</span>
      </a>
    </AboutPageShell>
  )
}

function CommunityRulesPage() {
  return (
    <AboutPageShell
      currentSlug="regles-communaute"
      eyebrow="Un espace accueillant"
      title="Règles de la communauté"
      introduction="PlayerPG est fait pour partager une passion. Ces quelques repères servent à garder les échanges et les contributions agréables pour tout le monde."
    >
      <section>
        <h2>Respecter les personnes</h2>
        <p>
          Les désaccords sur un jeu ou une définition sont normaux. Les insultes, le harcèlement, les propos discriminatoires et les attaques personnelles ne le sont pas.
        </p>
      </section>
      <section>
        <h2>Contribuer de bonne foi</h2>
        <p>
          Les propositions au glossaire doivent chercher à informer : pas de publicité déguisée, de contenu volontairement trompeur, de plagiat ni de sources inventées.
        </p>
      </section>
      <section>
        <h2>Garder le lieu accessible</h2>
        <p>
          Évite le contenu illégal, choquant ou sexuellement explicite. Lorsqu&apos;un sujet sensible est utile à une définition, il doit être présenté avec mesure et uniquement dans un but informatif.
        </p>
      </section>
      <aside className="about-note">
        <p>
          Une contribution qui ne respecte pas ces règles peut être refusée ou retirée. En cas d&apos;abus répété, l&apos;accès au compte pourra être limité.
        </p>
      </aside>
    </AboutPageShell>
  )
}

function PrivacyPage() {
  return (
    <AboutPageShell
      currentSlug="confidentialite"
      eyebrow="Ce que PlayerPG sait de toi"
      title="Protection des données"
      introduction="PlayerPG ne cherche pas à tout savoir. Les données utilisées servent à faire fonctionner ton compte, tes favoris, tes contributions et les recommandations que tu demandes."
    >
      <aside className="about-note">
        <p>
          Cette page est une version de travail fidèle au fonctionnement actuel. Elle sera complétée avant le lancement définitif avec l&apos;identité du responsable, une adresse de contact dédiée et les durées de conservation précises.
        </p>
      </aside>

      <section>
        <h2>Les données liées à ton compte</h2>
        <ul>
          <li>ton adresse e-mail et ton pseudo ;</li>
          <li>ton avatar, seulement si tu choisis d&apos;en ajouter un ;</li>
          <li>tes favoris et, plus tard, les autres listes que tu décideras de créer ;</li>
          <li>tes propositions au glossaire, leurs sources et leur état de validation ;</li>
          <li>les notifications relatives à ces contributions.</li>
        </ul>
        <p>
          Ces informations servent à fournir les fonctionnalités demandées, sécuriser l&apos;accès au compte et personnaliser l&apos;expérience. Elles ne sont pas vendues.
        </p>
      </section>

      <section>
        <h2>Le guide RPG</h2>
        <p>
          Le texte de ta demande, une sélection de données de jeux et les informations nécessaires pour rapprocher ou exclure tes favoris sont transmis au modèle Mistral pour produire la réponse. L&apos;e-mail, le pseudo et l&apos;avatar ne sont pas envoyés avec cette demande. La dernière recherche est conservée localement dans ton navigateur pour permettre le retour depuis une fiche.
        </p>
      </section>

      <section>
        <h2>Session, statistiques et traceurs</h2>
        <p>
          PlayerPG utilise actuellement le stockage nécessaire au maintien de ta session et à certaines préférences utiles. Aucun outil de mesure d&apos;audience ou cookie publicitaire n&apos;est intégré à ce jour. Si cela change, cette page et les choix proposés aux visiteurs seront mis à jour avant leur activation.
        </p>
      </section>

      <section>
        <h2>Services qui participent au fonctionnement</h2>
        <p>
          Supabase assure actuellement les comptes et la base de données, Vercel héberge temporairement le site, Mistral produit les recommandations et IGDB fournit les données de jeux. Chacun peut traiter les informations techniques nécessaires à son service selon ses propres engagements.
        </p>
      </section>

      <section>
        <h2>Tes droits</h2>
        <p>
          Dans le cadre du RGPD, tu peux notamment demander l&apos;accès, la rectification, l&apos;effacement ou la portabilité de tes données, ainsi que t&apos;opposer à certains usages. La suppression complète du compte est déjà disponible depuis ton profil.
        </p>
        <p>
          Le règlement européen sur l&apos;IA encadre notamment la transparence autour des systèmes d&apos;IA. Le Data Act complète le cadre européen concernant l&apos;accès à certaines données et leur circulation. PlayerPG précisera les obligations réellement applicables à mesure que ses services évolueront.
        </p>
      </section>

      <div className="not-prose flex flex-wrap gap-3">
        <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj" target="_blank" rel="noreferrer" className="about-secondary-link">RGPD ↗</a>
        <a href="https://eur-lex.europa.eu/eli/reg/2024/1689/oj" target="_blank" rel="noreferrer" className="about-secondary-link">Règlement sur l&apos;IA ↗</a>
        <a href="https://eur-lex.europa.eu/eli/reg/2023/2854/oj" target="_blank" rel="noreferrer" className="about-secondary-link">Data Act ↗</a>
      </div>
    </AboutPageShell>
  )
}

function TermsPage() {
  return (
    <AboutPageShell
      currentSlug="conditions"
      eyebrow="Le cadre, en langage clair"
      title="Conditions d'utilisation"
      introduction="Utiliser PlayerPG doit rester simple. Cette page pose les bases : ce que la plateforme propose, ce que chacun peut y faire et les limites à garder en tête."
    >
      <aside className="about-note">
        <p>
          Il s&apos;agit d&apos;un modèle éditorial, pas encore des conditions définitives. Les informations sur l&apos;éditeur, l&apos;hébergement durable et le contact seront ajoutées avant publication finale.
        </p>
      </aside>
      <section>
        <h2>Utiliser PlayerPG</h2>
        <p>
          Tu peux consulter librement les contenus publics. Certaines fonctions, comme les favoris ou les propositions au glossaire, demandent un compte. Tu es responsable des informations de connexion à ce compte et de l&apos;activité qui y est réalisée.
        </p>
      </section>
      <section>
        <h2>Les contributions</h2>
        <p>
          En proposant une définition, tu confirmes pouvoir partager son contenu et ses sources. Tu autorises PlayerPG à la relire, la corriger, la publier ou la refuser pour préserver la qualité du glossaire. Tu restes crédité comme auteur lorsque la contribution est publiée.
        </p>
      </section>
      <section>
        <h2>Les informations et recommandations</h2>
        <p>
          PlayerPG fait de son mieux pour afficher des informations utiles, mais les données de jeux peuvent être incomplètes ou comporter des erreurs. Les propositions du guide RPG sont générées automatiquement : elles servent à la découverte et ne garantissent pas qu&apos;un jeu te plaira.
        </p>
      </section>
      <section>
        <h2>Faire évoluer le service</h2>
        <p>
          La plateforme est encore en développement. Une fonctionnalité peut être modifiée, interrompue ou remplacée, notamment pour des raisons techniques, éditoriales ou de sécurité. Toute évolution importante de ces conditions sera datée et présentée clairement.
        </p>
      </section>
    </AboutPageShell>
  )
}

function ContactPage() {
  return (
    <AboutPageShell
      currentSlug="contact"
      eyebrow="Une vraie personne au bout du message"
      title="Contactez-nous"
      introduction="Une question, une erreur dans une fiche ou simplement une idée pour PlayerPG ? Les retours sont les bienvenus."
    >
      <div className="panel rounded-[1.5rem] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-cool)]">Adresse en préparation</p>
        <h2 className="font-display mt-3 text-3xl text-[var(--foreground)]">Le courrier arrive bientôt</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Une adresse e-mail PlayerPG dédiée sera affichée ici dès que le service d&apos;envoi aura été choisi. En attendant, tu peux passer par le compte Twitter du projet.
        </p>
        <a
          href="https://twitter.com/Nasake46"
          target="_blank"
          rel="noreferrer"
          className="about-primary-link"
        >
          Écrire à @Nasake46
          <span aria-hidden="true">↗</span>
        </a>
      </div>
      <section>
        <h2>Pour nous aider à répondre</h2>
        <p>
          Si ton message concerne un problème, indique la page visitée, ce que tu essayais de faire et ce qui s&apos;est passé. Évite d&apos;envoyer ton mot de passe, une clé d&apos;accès ou toute autre information sensible.
        </p>
      </section>
    </AboutPageShell>
  )
}

export default async function InformationPage({ params }: PageProps) {
  const { slug } = await params

  switch (slug) {
    case 'guide-rpg':
      return <GuideRpgPage />
    case 'glossaire':
      return <GlossaryInfoPage />
    case 'faq':
      return <FaqPage />
    case 'donnees-jeux':
      return <GameDataPage />
    case 'regles-communaute':
      return <CommunityRulesPage />
    case 'confidentialite':
      return <PrivacyPage />
    case 'conditions':
      return <TermsPage />
    case 'contact':
      return <ContactPage />
    default:
      notFound()
  }
}
