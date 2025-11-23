import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Free Smart Calendar Bot – Telegram, WhatsApp, Slack | Hello Tomo",
  description = "Connect Google Calendar and schedule meetings through your favorite chat apps: Telegram, WhatsApp or Slack. Create events, check availability and invite contacts. Set up in minutes.",
  keywords = "smart calendar bot, google calendar bot, schedule meetings chat, telegram slack whatsapp calendar, meeting scheduler, chat automation, google calendar integration, free calendar bot",
  canonical = "https://cal.hellotomo.ai",
  ogTitle,
  ogDescription,
  ogUrl
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:url" content={ogUrl || canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Hello Tomo" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
    </Helmet>
  );
};

export default SEOHead;