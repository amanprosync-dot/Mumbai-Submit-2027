The Grand E-Com Summit by Amar Bedi — Mumbai 2027 landing page
================================================================

Files
  index.html      Page markup
  css/styles.css  All styles (responsive breakpoints at 1080, 980, 900, 860, 760, 620, 560px)
  js/main.js      Nav, countdown, scroll reveals, counters, panels, card slider, form

Deploy
  Upload the whole folder as-is, keeping the css/ and js/ subfolders next to index.html.

Before going live — edit the top of js/main.js:
  FORM_ENDPOINT  Webhook/CRM URL that receives the registration as a JSON POST.
  PAYMENT_URLS   Payment link per pass (Women, Men, Couple, VIP). Name, email and
                 phone are appended as query parameters. If left empty, the form
                 shows a thank-you message instead of redirecting.

Images
  Photos load from the existing FlexiFunnels CDN (img.flexifunnels.com). Check that
  the portrait in the "Meet Amar Bedi" section is the right photo; to change any
  image, swap its src in index.html. Missing images hide themselves cleanly.

Event details to update in index.html if they change
  Date/time: countdown data-target="2027-01-16T09:00:00+05:30" plus the text mentions
  Seats left: "27" appears in the hero badge, registration panel and mobile sticky bar
