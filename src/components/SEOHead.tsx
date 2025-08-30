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
  title = "Free Smart Telegram Calendar Bot - Tomo QuickCal",
  description = "Free smart Telegram calendar bot for Google Calendar. Schedule meetings, create events, and manage your calendar directly through Telegram messages. Connect in 2 minutes.",
  keywords = "smart telegram calendar, google calendar telegram bot, schedule meetings telegram, smart calendar bot, meeting scheduler, telegram automation, google calendar integration, free calendar bot, telegram scheduling assistant",
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
      <meta property="og:site_name" content="Tomo QuickCal" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
    </Helmet>
  );
};

export default SEOHead;