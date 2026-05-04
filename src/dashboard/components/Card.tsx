import type { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  ariaLabel?: string;
}

export function Card({ title, subtitle, actions, children, flush, ariaLabel }: CardProps) {
  return (
    <section className={styles.card} aria-label={ariaLabel ?? title}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.subtitle}>
          {subtitle}
          {actions}
        </div>
      </header>
      <div className={flush ? styles.bodyFlush : styles.body}>{children}</div>
    </section>
  );
}
