import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

type Word = {
  text: string;
  className?: string;
};

export function TypewriterEffectSmooth({
  words,
  className,
  cursorClassName,
}: {
  words: Word[];
  className?: string;
  cursorClassName?: string;
}) {
  const wordsArray = words.map((word) => ({
    ...word,
    text: word.text.split(''),
  }));

  return (
    <div className={cn('my-6 flex items-center justify-center space-x-1', className)}>
      <motion.div
        className="overflow-hidden pb-2"
        initial={{ width: '0%' }}
        whileInView={{ width: 'fit-content' }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{
          duration: 2,
          ease: 'linear',
          delay: 0.4,
        }}
      >
        <motion.div
          className="text-2xl font-bold whitespace-nowrap text-white sm:text-3xl md:text-4xl lg:text-5xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.2, ease: 'easeIn' }}
        >
          {wordsArray.map((word, idx) => (
            <span key={`word-${idx}`} className="inline-block">
              {word.text.map((char, index) => (
                <span key={`char-${index}`} className={cn('text-white', word.className)}>
                  {char}
                </span>
              ))}
              &nbsp;
            </span>
          ))}
        </motion.div>
      </motion.div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className={cn('block h-8 w-1 rounded-sm bg-zinc-100 sm:h-10 md:h-12', cursorClassName)}
      />
    </div>
  );
}
