# Emails Module

This module contains HTML email templates for PGC Tour communications and notifications.

## 📁 Files Overview

### `reminder.html` ✅
**Tournament reminder email template**

**Purpose:** Provides a clean, responsive HTML email template for reminding users to make their tournament picks before deadlines.

**Design Features:**
- Responsive design (max-width: 600px)
- PGC Tour branding with logo
- Clean typography using Arial font family
- Call-to-action button with tournament logo
- Mobile-friendly inline styling

**Template Structure:**
```html
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
  <!-- PGC Tour Logo Header -->
  <div style="text-align:center;padding:20px 0;">
    <img src="[PGC_LOGO_URL]" alt="PGC Tour Logo" />
  </div>
  
  <!-- Title -->
  <h1 style="text-align:center;font-size:22px;">PGC Reminder</h1>
  
  <!-- Message Content -->
  <p>Don't forget to make your PGC picks for the [TOURNAMENT_NAME]</p>
  
  <!-- Call to Action Button -->
  <p style="text-align:center;margin-top:20px;">
    <a href="[TOURNAMENT_URL]" style="background-color:#d3d3d3;color:black;">
      <img src="[TOURNAMENT_LOGO]" alt="Tournament Logo" />
      Make your Picks
    </a>
  </p>
</div>
```

**Usage Context:**
- Sent 24-48 hours before tournament deadlines
- Triggered by automated reminder system
- Personalized with specific tournament details

### `seasonOpener.html` ✅
**Season opening announcement email template**

**Purpose:** Welcome email template for the start of each PGC Tour season, including season highlights, new features, and first tournament information.

**Content Structure:**
- **Season Announcement:** "The 2025 PGC Tour Season is Here"
- **Tournament Information:** Details about opening tournament
- **App Features:** Highlights of new clubhouse features
- **Tour Structure:** Information about dual tours (CCG/Dreams by Dutch)
- **Prize Information:** Season prize pool and championship details
- **Call to Action:** Make picks for opening tournament

**Key Messaging:**
```html
<h1>The 2025 PGC Tour Season is Here</h1>

<p>Season 5 of the PGC Tour has finally arrived...</p>

<p>The PGC Clubhouse has been completely rebuilt...</p>

<p>This season we have rebranded with the Coach Carter Golf tour...</p>

<!-- Call to Action -->
<a href="[TOURNAMENT_URL]">Make your Picks</a>
```

**Features Highlighted:**
- Rebuilt clubhouse experience
- Friend system with star highlighting
- Team golfer highlighting on PGA leaderboard
- Mobile app installation instructions
- Dual tour system (CCG vs Dreams by Dutch)
- Prize structure ($4,500 per tour, $1,500 championship)

## 🎨 Email Design System

### Brand Identity
**Logo Usage:**
```html
<!-- Primary PGC Tour Logo -->
<img src="https://jn9n1jxo7g.ufs.sh/f/5339b6fc-5091-44b3-a220-86a7d391c84d-5nw9l7.png" 
     alt="PGC Tour Logo" 
     style="max-width:100%;height:auto">

<!-- Tournament-specific logos (e.g., WMO) -->
<img src="https://jn9n1jxo7g.ufs.sh/f/fdc56a4e-9e76-435d-99ce-83b3f37e996a-smdygw.png" 
     alt="Tournament Logo" 
     style="max-width:40px;height:40px">
```

**Color Scheme:**
- Background: `#ffffff` (white)
- Text: `#333333` (dark gray)
- Button Background: `#d3d3d3` (light gray)
- Button Text: `black`
- Links: `black` with underline

**Typography:**
- Font Family: `Arial, sans-serif`
- Heading Size: `22px` with `font-weight:bold`
- Line Height: `1.5` for readability
- Text Color: `#333` for accessibility

### Responsive Design
**Container:**
```css
max-width: 600px;
margin: 0 auto;
font-family: Arial, sans-serif;
color: #333;
line-height: 1.5;
```

**Mobile Considerations:**
- Images scale with `max-width: 100%`
- Buttons use flexbox for proper alignment
- Padding adjusts for smaller screens
- Text remains readable on mobile devices

## 🔧 Template Customization

### Dynamic Content Variables
```html
<!-- Tournament-specific variables -->
[TOURNAMENT_NAME] → "Waste Management Open"
[TOURNAMENT_URL] → "https://www.pgctour.ca/tournament/[id]"
[TOURNAMENT_LOGO] → Tournament-specific logo URL

<!-- User-specific variables -->
[USER_NAME] → Recipient's display name
[DEADLINE_DATE] → Pick deadline
[TOUR_NAME] → "CCG" or "Dreams by Dutch"
```

### Template Extension
```html
<!-- Add new content sections -->
<div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9;">
  <h3 style="margin: 0 0 10px 0;">New Feature Highlight</h3>
  <p style="margin: 0;">Description of new feature...</p>
</div>

<!-- Additional call-to-action buttons -->
<p style="text-align:center; margin-top: 15px;">
  <a href="[LEADERBOARD_URL]" 
     style="background-color:#333; color:white; padding:8px 16px; text-decoration:none; border-radius:4px;">
    View Leaderboard
  </a>
</p>
```

## 📬 Email Integration

### SMTP Configuration
These templates integrate with the application's email system through environment variables:

```env
# Email configuration (commented in env.js)
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
GODADDY_EMAIL=noreply@pgctour.ca
GODADDY_PASSWORD=email_password
```

### Email Sending Integration
```typescript
// Example integration with email service
import { sendEmail } from '@/src/lib/email';

export async function sendTournamentReminder(
  userEmail: string, 
  tournamentData: Tournament
) {
  const htmlTemplate = await fs.readFile(
    '/src/lib/emails/reminder.html', 
    'utf-8'
  );
  
  const personalizedHtml = htmlTemplate
    .replace('[TOURNAMENT_NAME]', tournamentData.name)
    .replace('[TOURNAMENT_URL]', `https://pgctour.ca/tournament/${tournamentData.id}`)
    .replace('[TOURNAMENT_LOGO]', tournamentData.logoUrl);
    
  await sendEmail({
    to: userEmail,
    subject: `PGC Reminder: ${tournamentData.name}`,
    html: personalizedHtml
  });
}
```

### Automated Email Triggers
- **Tournament Reminders:** Sent 24-48 hours before pick deadlines
- **Season Opener:** Sent at the beginning of each season
- **Weekly Updates:** Tournament results and standings
- **Achievement Notifications:** Wins, top finishes, milestones

## 📋 Best Practices

### ✅ Email Design Best Practices
- Use inline CSS for maximum compatibility
- Keep images optimized and hosted reliably
- Maintain 600px max width for desktop readability
- Include alt text for all images
- Use web-safe fonts (Arial, Helvetica, sans-serif)
- Test across multiple email clients

### ✅ Content Guidelines
- Keep subject lines under 50 characters
- Use clear, actionable call-to-action buttons
- Include unsubscribe links (when implemented)
- Maintain consistent branding
- Keep content concise and scannable

### ❌ Avoid
- Complex CSS layouts or animations
- Large image files that slow loading
- Missing alt text for accessibility
- Unclear or multiple conflicting CTAs
- Overly long email content

## 🔄 Template Maintenance

### Updating Templates
1. **Modify HTML files** directly for content changes
2. **Test across email clients** (Gmail, Outlook, Apple Mail)
3. **Validate HTML** for email compatibility
4. **Check mobile responsiveness**
5. **Update integration code** if structure changes

### Adding New Templates
```html
<!-- New template structure -->
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333;line-height:1.5;">
  <!-- Header with logo -->
  <div style="text-align:center;padding:20px 0;">
    <img src="[PGC_LOGO_URL]" alt="PGC Tour Logo" style="max-width:100%;height:auto">
  </div>
  
  <!-- Title -->
  <h1 style="text-align:center;font-size:22px;font-weight:bold">[EMAIL_TITLE]</h1>
  
  <!-- Content sections -->
  <div style="padding:0 20px;">
    [CONTENT_SECTIONS]
  </div>
  
  <!-- Footer -->
  <div style="text-align:center;padding:20px;color:#666;font-size:12px;">
    [FOOTER_CONTENT]
  </div>
</div>
```

This emails module provides professional, branded communication templates that maintain consistency across all PGC Tour email communications while ensuring maximum compatibility across email clients and devices.
