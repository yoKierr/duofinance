import { BackgroundGradient } from '@/components/ui/background-gradient';

const cards = [
  {
    title: 'Курсы онлайн',
    description:
      'Короткие уроки по финансовой грамотности — в любое время и с телефона. Начните с основ и двигайтесь к сложным темам в своём темпе.',
    image: '/landing/feature-courses.png',
    alt: 'Сетка уроков Finstart с прогрессом и наградами',
  },
  {
    title: 'Игровой формат',
    description:
      'Квизы, стрики и награды — как в Duolingo, только про бюджет, сбережения и защиту от мошенников. Учиться проще, когда виден прогресс.',
    image: '/landing/feature-quiz.png',
    alt: 'Интерактивный квиз по правилу 50/30/20',
  },
  {
    title: 'Прогресс и достижения',
    description:
      'Алмазы за уроки, достижения в профиле и магазин наград. Закрепляйте привычку учиться и отмечайте каждый шаг вперёд.',
    image: '/landing/feature-achievements.png',
    alt: 'Список достижений с наградами в алмазах',
  },
];

export function FeatureGradientCards() {
  return (
    <div className="grid gap-10 md:grid-cols-3">
      {cards.map((card) => (
        <BackgroundGradient
          key={card.title}
          className="flex h-full flex-col rounded-[22px] bg-zinc-950 p-4 sm:p-6"
          containerClassName="h-full"
        >
          <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-900">
            <img
              src={card.image}
              alt={card.alt}
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          </div>
          <div className="mt-4 flex flex-1 flex-col text-left">
            <h3 className="text-lg font-semibold leading-snug text-white sm:text-xl">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{card.description}</p>
          </div>
        </BackgroundGradient>
      ))}
    </div>
  );
}
