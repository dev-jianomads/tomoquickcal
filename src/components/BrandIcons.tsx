import React from 'react';

type IconProps = {
  size?: number;
  className?: string;
};

export const TelegramIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <img
    src="/assets/Telegram_logo.svg"
    width={size}
    height={size}
    alt="Telegram"
    className={className}
    style={{ display: 'block' }}
    loading="lazy"
    decoding="async"
  />
);

export const SlackIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <img
    src="/assets/Slack_icon_2019.svg"
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

