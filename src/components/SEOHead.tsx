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
  title = "Tomo QuickCal - Schedule meetings through Telegram",
  description = "Schedule meetings effortlessly through Telegram messages. Connect your Google Calendar to Tomo QuickCal and create events, find contacts, and manage your schedule directly from Telegram.",
  keywords = "telegram calendar, google calendar telegram bot, schedule meetings telegram, calendar bot, meeting scheduler, telegram automation, google calendar integration",
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