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
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
    preserveAspectRatio="xMidYMid meet"
  >
    {/* Simplified official Slack glyph, scaled for small sizes */}
    <path fill="#36C5F0" d="M5.1 14.2c0 .9-.8 1.7-1.7 1.7S1.7 15.1 1.7 14.2s.8-1.7 1.7-1.7h1.7v1.7zM6 14.2c0-.9.8-1.7 1.7-1.7h4.3c.9 0 1.7.8 1.7 1.7s-.8 1.7-1.7 1.7H7.7C6.8 15.9 6 15.1 6 14.2z"/>
    <path fill="#2EB67D" d="M9.4 5.1c-.9 0-1.7-.8-1.7-1.7S8.5 1.7 9.4 1.7s1.7.8 1.7 1.7v1.7H9.4zM9.4 6c.9 0 1.7.8 1.7 1.7v4.3c0 .9-.8 1.7-1.7 1.7s-1.7-.8-1.7-1.7V7.7C7.7 6.8 8.5 6 9.4 6z"/>
    <path fill="#E01E5A" d="M18.5 9.4c0-.9.8-1.7 1.7-1.7s1.7.8 1.7 1.7-.8 1.7-1.7 1.7h-1.7V9.4zM17.6 9.4c0 .9-.8 1.7-1.7 1.7h-4.3c-.9 0-1.7-.8-1.7-1.7s.8-1.7 1.7-1.7h4.3c.9 0 1.7.8 1.7 1.7z"/>
    <path fill="#ECB22E" d="M14.2 18.5c.9 0 1.7.8 1.7 1.7s-.8 1.7-1.7 1.7-1.7-.8-1.7-1.7v-1.7h1.7zM14.2 17.6c-.9 0-1.7-.8-1.7-1.7V11.6c0-.9.8-1.7 1.7-1.7s1.7.8 1.7 1.7v4.3c0 .9-.8 1.7-1.7 1.7z"/>
  </svg>
);

export default { TelegramIcon, SlackIcon };

