import React from 'react';

type IconProps = {
  size?: number;
  className?: string;
};

export const TelegramIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 240 240"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <circle cx="120" cy="120" r="120" fill="#26A5E4" />
    <path
      d="M179.2 72.5c2.5-10.3-8.3-8.7-13.9-6.4-7.9 3.2-107.9 41.5-114.9 44.3-7 2.8-4.7 6.7-4.7 6.7s3.4 1.1 7.8 2.4c4.4 1.3 10.2 2.9 13.2 2.1 3-0.8 60.8-38.7 63.6-40.4 2.9-1.6 4.9 0.3 2.8 2.1-2.1 1.8-40.6 36.5-43.6 39.4-3 2.9-1.9 4.6-0.1 6.1 1.8 1.5 33.4 22.3 35.8 23.9 2.5 1.6 5.1 2.8 9.5 0.2 4.4-2.5 24.3-15.8 30.5-20.2 6.2-4.4 12.8-9.7 13.7-15.2 0.9-5.6 6.7-41.2 7.3-44.9z"
      fill="#fff"
    />
  </svg>
);

export const SlackIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 2447 2452"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    {/* Official Slack logo (2019) */}
    <path d="M572 0c-158 0-286 128-286 286s128 286 286 286h286V286C858 128 730 0 572 0z" fill="#36C5F0"/>
    <path d="M715 858H286C128 858 0 986 0 1144s128 286 286 286h429c158 0 286-128 286-286S873 858 715 858z" fill="#36C5F0"/>

    <path d="M2452 1144c0-158-128-286-286-286s-286 128-286 286v286h286c158 0 286-128 286-286z" fill="#2EB67D"/>
    <path d="M1710 1001V572c0-158-128-286-286-286s-286 128-286 286v429c0 158 128 286 286 286s286-128 286-286z" fill="#2EB67D"/>

    <path d="M858 1866c0 158 128 286 286 286s286-128 286-286v-286H1144c-158 0-286 128-286 286z" fill="#E01E5A"/>
    <path d="M1001 1144H572c-158 0-286 128-286 286s128 286 286 286h429c158 0 286-128 286-286s-128-286-286-286z" fill="#E01E5A"/>

    <path d="M1144 0c-158 0-286 128-286 286v286h286c158 0 286-128 286-286S1302 0 1144 0z" fill="#ECB22E"/>
    <path d="M858 1724v429c0 158 128 286 286 286s286-128 286-286v-429c0-158-128-286-286-286s-286 128-286 286z" fill="#ECB22E"/>
  </svg>
);

export default { TelegramIcon, SlackIcon };

