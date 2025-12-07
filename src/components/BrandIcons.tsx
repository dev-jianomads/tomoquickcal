import React from 'react';

type IconProps = {
  size?: number;
  className?: string;
};

export const TelegramIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
    preserveAspectRatio="xMidYMid meet"
  >
    {/* Paper plane without circular background, in Telegram brand blue */}
    <path
      fill="#26A5E4"
      d="M21.94 2.26a1.1 1.1 0 00-1.15-.18L2.37 9.77a1.1 1.1 0 00.04 2.05l5.44 1.88 1.9 5.68c.15.44.52.76.97.83h.16c.39 0 .76-.19.99-.5l2.75-3.71 5.41 3.94c.2.15.43.22.66.22.18 0 .36-.04.53-.12.36-.17.61-.5.69-.89l3.04-14.67c.1-.48-.11-.96-.53-1.24zM9.37 12.8l7.86-4.83-5.88 6.54-.3.33-.42 2.54-1.26-3.76z"
    />
  </svg>
);

export const SlackIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <img
    src="/assets/slack-icon-2019.svg"
    width={size}
    height={size}
    alt="Slack"
    className={className}
    style={{ display: 'block' }}
    loading="lazy"
    decoding="async"
  />
);

export default { TelegramIcon, SlackIcon };

