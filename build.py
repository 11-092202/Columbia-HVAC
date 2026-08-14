# -*- coding: utf-8 -*-
"""
Columbia HVAC Co. — static site generator.
Produces plain HTML files (no runtime templating) from shared partials +
per-page content, using ONLY facts from columbia-hvac-co-site-extract.md.
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
PHONE = "573-204-6161"
PHONE_TEL = "5732046161"
ADDRESS = "1403 W Ash St, Columbia, MO 65203"
FACEBOOK = "https://www.facebook.com/profile.php?id=100080658311644"
AREAS = ["Columbia", "Prathersville", "Stevens", "Shaw", "Harg", "Pierpoint", "Huntsdale", "McBaine"]
MAP_QUERY = "1403%20W%20Ash%20St%2C%20Columbia%2C%20MO%2065203"

# ---------------------------------------------------------------------------
# Real client photography on hand right now (as opposed to CSV-only
# placeholders). Add to this dict as more real photos come in.
# ---------------------------------------------------------------------------
REAL_PHOTOS = {
    "furnace-install": {
        "path": "assets/images/home/home-affordable-furnace-and-ac-repair.jpg",
        "alt": "Newly installed high-efficiency Maytag furnace and air handler in a Columbia, MO home",
        "ar": "3/2",
    },
    "hero-ac-service": {
        "path": "assets/images/home/home-hero-technician-servicing-outdoor-ac.jpg",
        "alt": "Columbia HVAC Co. technicians servicing a commercial rooftop air conditioning unit",
        "ar": "16/9",
    },
    "ac-condenser-outdoor": {
        "path": "assets/images/home/home-ac-repair-service.jpg",
        "alt": "Outdoor residential air conditioning condenser unit installed beside a home",
        "ar": "4/3",
    },
    "air-duct-before-after": {
        "path": "assets/images/air-duct-cleaning/air-duct-cleaning-main.jpg",
        "alt": "Air duct before and after professional cleaning, showing removed dust and debris buildup",
        "ar": "4/3",
    },
    "emergency-hvac-banner": {
        "path": "assets/images/emergency-hvac/emergency-hvac-main.jpg",
        "alt": "Emergency HVAC service technician repairing an air conditioning unit",
        "ar": "4/3",
        # This is a designed graphic with "EMERGENCY HVAC SERVICE" text baked
        # into the left side. Center-cropping (the default) sliced through
        # that text, so anchor the crop to the left edge instead — the
        # cropping then only ever eats into the technician on the right.
        "object_position": "0% 50%",
    },
    "ac-contractor-units": {
        "path": "assets/images/air-conditioning-contractor/air-conditioning-contractor-columbia-mo.jpg",
        "alt": "Commercial air conditioning units installed behind a security fence in Columbia, MO",
        "ar": "4/3",
    },
    "thermostat": {
        "path": "assets/images/home/home-nest-thermostat.jpg",
        "alt": "Smart thermostat installed in a Columbia, MO home, set to 68 degrees",
        "ar": "3/2",
    },
    "technician-furnace-indoor": {
        "path": "assets/images/home/home-technician-servicing-furnace.jpg",
        "alt": "Columbia HVAC Co. technician servicing an indoor furnace and air handler",
        "ar": "3/2",
    },
    "rooftop-units": {
        "path": "assets/images/home/home-rooftop-hvac-units.jpg",
        "alt": "Rooftop HVAC condenser units and ductwork on a commercial building",
        "ar": "3/2",
    },
}


# Which real photo represents each service (same photos used on the
# homepage cards) — reused for each service page's main image and for that
# service's card wherever it appears in a "related services" widget.
SERVICE_CARD_PHOTOS = {
    "furnace-repair": "ac-condenser-outdoor",
    "air-conditioning-repair": "hero-ac-service",
    "air-duct-cleaning": "air-duct-before-after",
    "emergency-hvac-services": "emergency-hvac-banner",
    "air-conditioning-contractor": "ac-contractor-units",
    "heating-contractor": "furnace-install",
}


def real_photo(key, depth=0, extra_class="", extra_style="", ar=None):
    """Render an <img> for a real client photo, using the same --ar/
    border-radius contract as img_slot()/generic_slot() so it drops into
    any existing placeholder position without layout changes. Pass ar= to
    override the photo's default aspect ratio for a specific slot (e.g. a
    service card that needs to match its sibling cards). If the photo's
    REAL_PHOTOS entry sets "object_position", that's applied too - for
    graphics with baked-in text/logos where a center crop would cut
    something off."""
    p = REAL_PHOTOS[key]
    src = paths_for(depth)["root"] + p["path"]
    style = "--ar:%s;%s" % (ar or p["ar"], extra_style)
    if p.get("object_position"):
        style += "object-position:%s;" % p["object_position"]
    cls = ("real-photo " + extra_class).strip()
    return '<img class="%s" src="%s" alt="%s" style="%s" loading="lazy">' % (cls, src, p["alt"], style)

# ---------------------------------------------------------------------------
# Icons (feather-style inline SVG, stroke=currentColor)
# ---------------------------------------------------------------------------
def icon(name, size=22, stroke=2):
    paths = {
        "flame": '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7.5 7.5 0 1 1-15 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
        "snowflake": '<line x1="12" y1="2" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/><line x1="2" y1="12" x2="22" y2="12"/>',
        "wind": '<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>',
        "alert": '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        "thermometer": '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"/>',
        "tool": '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
        "check": '<polyline points="20 6 9 17 4 12"/>',
        "check-circle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
        "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
        "mail": '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
        "pin": '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
        "facebook": '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
        "star": '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        "chev-down": '<polyline points="6 9 12 15 18 9"/>',
        "arrow-up-right": '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>',
        "play": '<polygon points="5 3 19 12 5 21 5 3"/>',
        "clock": '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        "users": '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        "award": '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
        "dollar": '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
        "camera": '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
        "menu": '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
        "close": '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        "sparkle": '<path d="M12 3v4M12 17v4M5 5l2.5 2.5M16.5 16.5 19 19M3 12h4M17 12h4M5 19l2.5-2.5M16.5 7.5 19 5"/>',
    }
    return ('<svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>'
            ) % (size, size, stroke, paths[name])

# ---------------------------------------------------------------------------
# Service data (content sourced only from columbia-hvac-co-site-extract.md)
# ---------------------------------------------------------------------------
SERVICES = [
    {
        "slug": "furnace-repair",
        "file": "furnace-repair.html",
        "nav": "Furnace Repair",
        "icon": "flame",
        "title": "Furnace Repair",
        "meta_title": "Furnace Repair | Columbia HVAC Co.",
        "meta_desc": "Expert furnace repair in Columbia, MO. We diagnose overheating compressors and other furnace problems for homes and businesses. Call 573-204-6161.",
        "card_blurb": "Expert diagnosis and repair for overheating compressors and other furnace problems, for residential and commercial customers.",
        "body": [
            ("h2", "Compressor Overheating: A Common Cause of Furnace Problems"),
            ("p", "One of the most common issues behind furnace and air conditioning breakdowns is an overheating compressor. When a compressor runs too hot, it loses lubrication, and over time that can lead to full compressor failure."),
            ("callout", "Warning sign: if the discharge port on your compressor reads over 300°F, that's a serious problem that needs expert attention right away."),
            ("h2", "Furnace Repair for Homes &amp; Businesses"),
            ("p", "Columbia HVAC Co. provides furnace repair for both residential and commercial customers throughout the Columbia, MO area. We emphasize proper maintenance plans to help catch problems like compressor overheating before they lead to a full system breakdown."),
            ("p", "Notice your furnace running hotter than usual, cycling oddly, or making unfamiliar noises? Call us and we'll send a certified technician to diagnose the problem."),
        ],
    },
    {
        "slug": "air-conditioning-repair",
        "file": "air-conditioning-repair.html",
        "nav": "Air Conditioning Repair",
        "icon": "snowflake",
        "title": "Air Conditioning Repair Services",
        "meta_title": "Air Conditioning Repair Services | Columbia HVAC Co.",
        "meta_desc": "Residential and commercial A/C repair in Columbia, MO. Free estimates backed by a 100% satisfaction guarantee. Call 573-204-6161.",
        "card_blurb": "Fast troubleshooting and repair to get your A/C cooling again, backed by a 100% satisfaction guarantee.",
        "body": [
            ("h2", "Air Conditioning Repair for Homes &amp; Businesses"),
            ("p", "Columbia HVAC Co. repairs air conditioning systems for residential and commercial customers throughout the Columbia, MO area."),
            ("h2", "Energy-Saving Tips"),
            ("ul", [
                'Set your thermostat to "Cool" mode.',
                "Adjust the temperature 3–5°F below room temperature rather than cranking it down further.",
                "Check your registers to confirm cold air is actually coming through.",
            ]),
            ("h2", "Troubleshooting Before You Call"),
            ("ul", [
                "Reset your system at the circuit breaker.",
                "If the A/C is running but not blowing cold air, check for water pooling around the unit — this can point to frozen or dirty coils. Turn the system off, let it sit for about 3 hours, clean the coils, then restart.",
                "Check the power outlet for a blown fuse or tripped breaker.",
                "Confirm your thermostat is set correctly.",
            ]),
            ("callout", "If your A/C still won't kick on after these steps, the issue is likely a faulty motor or compressor — that calls for a professional."),
            ("p", "Contact Columbia HVAC Co. for a free estimate, backed by our 100% satisfaction guarantee."),
        ],
    },
    {
        "slug": "air-duct-cleaning",
        "file": "air-duct-cleaning.html",
        "nav": "Air Duct Cleaning",
        "icon": "wind",
        "title": "Air Duct Cleaning Service",
        "meta_title": "Air Duct Cleaning Service | Columbia HVAC Co.",
        "meta_desc": "Air duct cleaning in Columbia, MO to restore airflow and indoor air quality. Free estimate, 100% satisfaction guarantee. Call 573-204-6161.",
        "card_blurb": "Cleaning and inspection to restore airflow, improve indoor air quality, and ease the strain on your blower motor.",
        "body": [
            ("h2", "Why Clean Air Ducts Matter"),
            ("p", "Dirty or clogged air ducts reduce indoor air quality and system efficiency. They also force your blower motor to work harder, which can raise your energy bills."),
            ("h2", "Signs Your Ducts Need Cleaning"),
            ("ul", [
                "Dust blowing out of your vents.",
                "Whistling or unusually noisy airflow, which can point to a blockage from insulation, a broken filter piece, or a stuck damper.",
                "Reduced airflow in one or more rooms.",
            ]),
            ("h2", "Quick Checks You Can Do"),
            ("ul", [
                "Replace air filters regularly — a clogged filter can mimic the symptoms of dirty ducts.",
                "Check each room in your home or building for adequate airflow.",
                "Make sure all vents are open.",
                "Check return air inlets for blockage.",
                "Keep return vents uncovered — no paper, furniture, or pillows blocking them.",
            ]),
            ("p", "Columbia HVAC Co. offers a free estimate on ductwork cleaning, backed by our 100% satisfaction guarantee."),
        ],
    },
    {
        "slug": "emergency-hvac-services",
        "file": "emergency-hvac-services.html",
        "nav": "Emergency HVAC Services",
        "icon": "alert",
        "title": "Emergency HVAC Services",
        "meta_title": "Emergency HVAC Services | Columbia HVAC Co.",
        "meta_desc": "24/7 emergency heating and cooling repair in Columbia, MO with no extra nights, weekends, or holiday fees. Call 573-204-6161.",
        "card_blurb": "24/7 emergency heating and cooling repair with no extra fees on nights, weekends, or holidays.",
        "body": [
            ("h2", "24/7 Emergency Heating &amp; Cooling Repair"),
            ("p", "HVAC problems don't wait for business hours, and neither do we. Columbia HVAC Co. offers 24/7 emergency service with no extra fees for nights, weekends, or holidays."),
            ("h2", "What to Expect"),
            ("ul", [
                "An award-winning service team with a 100% satisfaction guarantee.",
                "Free estimates before any work begins.",
                "Discounts available for first-time and repeat customers.",
                "Service for both residential and commercial customers.",
                "Easy ways to reach us — by phone, email, text, or online.",
            ]),
            ("callout", "No emergency job is too small or too large."),
            ("p", "If your furnace or A/C fails unexpectedly, call us any time, day or night."),
        ],
    },
    {
        "slug": "air-conditioning-contractor",
        "file": "air-conditioning-contractor.html",
        "nav": "Air Conditioning Contractor",
        "icon": "tool",
        "title": "Air Conditioning Contractor",
        "meta_title": "Air Conditioning Contractor | Columbia HVAC Co.",
        "meta_desc": "Air conditioning repair, installation, and maintenance plans in Columbia, MO. 24/7/365 emergency A/C service. Call 573-204-6161.",
        "card_blurb": "Repair, installation, and maintenance for all types of A/C systems, plus efficient new system installs.",
        "body": [
            ("h2", "Full-Service Air Conditioning Contractor"),
            ("p", "Columbia HVAC Co. repairs all types of air conditioning systems and installs new, energy-efficient HVAC systems for homes and businesses throughout Columbia, MO."),
            ("h2", "Going Green: Check Your Thermostat"),
            ("p", "A faulty thermostat can waste a surprising amount of energy. If yours isn't reading or holding temperature accurately, installing a new thermostat is one of the simplest ways to improve efficiency."),
            ("h2", "What We Offer"),
            ("ul", [
                "Free estimates, plus a free first-time service visit.",
                "Repair for all types of A/C systems.",
                "Installation of new, efficient HVAC systems.",
                "24/7/365 emergency A/C service at no extra charge.",
                "Maintenance plans built for every budget.",
            ]),
            ("p", "Reach us by phone, text, email, or through our website — whichever is easiest for you."),
        ],
    },
    {
        "slug": "heating-contractor",
        "file": "heating-contractor.html",
        "nav": "Heating Contractor",
        "icon": "thermometer",
        "title": "Heating Contractor",
        "meta_title": "Heating Contractor | Columbia HVAC Co.",
        "meta_desc": "Heating installation, repair, and replacement in Columbia, MO. Free evaluation and estimate, 24/7 service. Call 573-204-6161.",
        "card_blurb": "Installation, repair, and replacement of modern heating systems to help lower your heating bills.",
        "body": [
            ("h2", "Heating Installation, Repair &amp; Replacement"),
            ("p", "Columbia HVAC Co. installs modern HVAC systems and repairs or replaces older ones for residential and commercial customers throughout Columbia, MO."),
            ("h2", "Common Causes of Poor Furnace Performance"),
            ("ul", ["Lack of regular maintenance.", "Compressor overheating."]),
            ("p", "We offer a free evaluation and estimate, plus quick diagnosis of furnace problems so small issues don't turn into costly breakdowns."),
            ("callout", "Proper maintenance and, when needed, replacement can go a long way toward lowering high heating bills."),
            ("p", "Available 24/7, with no extra fees for emergency service."),
        ],
    },
]
print("build.py part 1 loaded:", len(SERVICES), "services")

# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------
def paths_for(depth):
    """depth 0 = root-level page, depth 1 = page inside /services/"""
    root = "" if depth == 0 else "../"
    svc = "services/" if depth == 0 else ""
    return {"root": root, "svc": svc}

# ---------------------------------------------------------------------------
# Shared partials
# ---------------------------------------------------------------------------
def render_head(title, desc, depth):
    p = paths_for(depth)
    return """<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>%s</title>
  <meta name="description" content="%s">
  <link rel="icon" href="%sassets/logo/columbia-hvac-logo.png">
  <meta property="og:title" content="%s">
  <meta property="og:description" content="%s">
  <meta property="og:type" content="website">
  <meta name="theme-color" content="#f0983f">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="%scss/style.css">
  <link rel="stylesheet" href="%scss/components.css">
  <link rel="stylesheet" href="%scss/responsive.css">""" % (title, desc, p["root"], title, desc, p["root"], p["root"], p["root"])


NAV_ITEMS = [("Home", "index.html", "home"), ("About", "about.html", "about")]

def render_topbar(depth):
    p = paths_for(depth)
    return """  <div class="topbar">
    <div class="container">
      <span>%s <strong>24/7 Emergency HVAC Service</strong> — No Extra Nights, Weekends, or Holiday Fees</span>
      <a class="btn btn-primary btn-sm" href="tel:%s">Call %s</a>
    </div>
  </div>""" % (icon("flame", 16), PHONE_TEL, PHONE)


def render_header(depth, active):
    """active: 'home' | 'about' | 'services' | 'contact' | a service slug"""
    p = paths_for(depth)
    root, svc = p["root"], p["svc"]

    def cls(key):
        return " is-active" if active == key else ""

    service_links = "\n".join(
        '            <a href="%s%s">%s%s</a>' % (svc, s["file"], icon("chev-down", 0, 0) if False else "", s["nav"])
        for s in SERVICES
    )
    # fix: remove stray icon call above (kept simple)
    service_links = "\n".join(
        '            <a href="%s%s">%s</a>' % (svc, s["file"], s["nav"]) for s in SERVICES
    )

    mobile_service_links = "\n".join(
        '            <a href="%s%s" class="mobile-link" style="font-weight:600;font-size:.92rem;">%s</a>'
        % (svc, s["file"], s["nav"]) for s in SERVICES
    )

    return """  <header class="site-header">
    <div class="container">
      <a class="brand" href="%sindex.html" aria-label="Columbia HVAC Co. home">
        <img src="%sassets/logo/columbia-hvac-logo.png" alt="Columbia HVAC Co. logo">
      </a>

      <nav class="main-nav" aria-label="Primary">
        <ul>
          <li><a class="nav-link%s" href="%sindex.html">Home</a></li>
          <li><a class="nav-link%s" href="%sabout.html">About</a></li>
          <li class="has-dropdown">
            <a class="nav-link%s" href="%s%sindex.html">Services %s</a>
            <div class="dropdown-panel">
%s
              <a class="dd-all" href="%s%sindex.html">View All Services %s</a>
            </div>
          </li>
          <li><a class="nav-link%s" href="%scontact.html">Contact</a></li>
        </ul>
      </nav>

      <div class="header-cta">
        <a class="header-phone" href="tel:%s">
          <span class="icon-circle">%s</span>
          <span><small>Call Now</small>%s</span>
        </a>
        <a class="btn btn-primary" href="%scontact.html">Get a Free Estimate</a>
        <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">%s</button>
      </div>
    </div>
  </header>

  <div class="mobile-nav">
    <div class="mobile-nav-overlay"></div>
    <div class="mobile-nav-panel">
      <div class="mobile-nav-head">
        <img src="%sassets/logo/columbia-hvac-logo.png" alt="Columbia HVAC Co." style="height:34px;">
        <button class="mobile-nav-close" aria-label="Close menu">%s</button>
      </div>
      <a class="mobile-link" href="%sindex.html">Home</a>
      <a class="mobile-link" href="%sabout.html">About</a>
      <a class="mobile-link" href="#" data-mobile-toggle="mobileServicesMenu">Services %s</a>
      <div class="mobile-submenu" id="mobileServicesMenu">
%s
        <a href="%s%sindex.html" class="mobile-link" style="font-weight:700;color:var(--color-flame-600);">View All Services</a>
      </div>
      <a class="mobile-link" href="%scontact.html">Contact</a>
      <div class="mobile-nav-foot">
        <a class="btn btn-primary btn-block" href="tel:%s">Call %s</a>
      </div>
    </div>
  </div>""" % (
        root, root,
        cls("home"), root,
        cls("about"), root,
        " is-active" if active == "services" or any(active == s["slug"] for s in SERVICES) else "",
        root, svc, icon("chev-down", 14),
        service_links,
        root, svc, icon("arrow-up-right", 14),
        cls("contact"), root,
        PHONE_TEL, icon("phone", 18), PHONE,
        root,
        icon("menu", 20),
        root,
        icon("close", 18),
        root, root, icon("chev-down", 14),
        mobile_service_links,
        root, svc,
        root,
        PHONE_TEL, PHONE,
    )


def render_footer(depth):
    p = paths_for(depth)
    root, svc = p["root"], p["svc"]
    service_footer_links = "\n".join(
        '            <a href="%s%s">%s</a>' % (svc, s["file"], s["nav"]) for s in SERVICES
    )
    area_spans = "\n".join('          <span>%s</span>' % a for a in AREAS)

    return """  <footer class="site-footer">
    <div class="container footer-top">
      <div class="footer-brand" data-reveal="fade">
        <div class="footer-logo-chip"><img src="%sassets/logo/columbia-hvac-logo.png" alt="Columbia HVAC Co. logo"></div>
        <p>For the best in heating and cooling in the Columbia area, Columbia HVAC Co. is a family-owned company providing reliable, affordable HVAC service to homeowners and businesses.</p>
        <div class="social-row" style="justify-content:center;margin-top:18px;">
          <a class="social-btn" href="%s" target="_blank" rel="noopener" aria-label="Columbia HVAC Co. on Facebook">%s</a>
        </div>
      </div>

      <div class="footer-grid">
        <div class="footer-col">
          <h4>Contact Us</h4>
          <div class="footer-contact-item">
            <span class="icon-circle">%s</span>
            <span>%s</span>
          </div>
          <div class="footer-contact-item">
            <span class="icon-circle">%s</span>
            <a href="tel:%s">%s</a>
          </div>
          <div class="footer-contact-item">
            <span class="icon-circle">%s</span>
            <span>Available 24/7 for emergencies</span>
          </div>
        </div>

        <div class="footer-col">
          <h4>Our Services</h4>
          <div class="footer-nav-list">
%s
          </div>
        </div>

        <div class="footer-col">
          <h4>Service Area</h4>
          <div class="footer-areas">
%s
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container">
        <span>&copy; <span data-year>2026</span> Columbia HVAC Co. All Rights Reserved.</span>
        <nav style="display:flex;gap:20px;">
          <a href="%sindex.html">Home</a>
          <a href="%sabout.html">About</a>
          <a href="%s%sindex.html">Services</a>
          <a href="%scontact.html">Contact</a>
        </nav>
      </div>
    </div>
  </footer>

  <script src="%sjs/navigation.js"></script>
  <script src="%sjs/main.js"></script>
  <script src="%sjs/ai-assistant.js"></script>""" % (
        root, FACEBOOK, icon("facebook", 18),
        icon("pin", 18), ADDRESS,
        icon("phone", 18), PHONE_TEL, PHONE,
        icon("clock", 18),
        service_footer_links,
        area_spans,
        root, root, root, svc, root,
        root, root, root,
    )


def render_lead_form(depth, heading="Request a Free Estimate", compact=False):
    action_note = "This form does not submit yet — it's wired for a future backend integration (see js/main.js)."
    fields_extra = "" if compact else """
        <div class="form-group">
          <label for="subject">What do you need help with?</label>
          <select id="subject" name="subject">
            <option>General Inquiry</option>
            <option>Furnace Repair</option>
            <option>Air Conditioning Repair</option>
            <option>Air Duct Cleaning</option>
            <option>Emergency HVAC Service</option>
            <option>Free Estimate / New Installation</option>
          </select>
        </div>"""
    return """      <div class="form-card" data-reveal="right">
        <h3>%s</h3>
        <p style="color:var(--color-text-muted);margin:10px 0 22px;">Send us a few details and our operator will follow up — we can often have someone out the same day.</p>
        <form data-lead-form novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" placeholder="Your full name" required>
            </div>
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" placeholder="(573) 000-0000" required>
            </div>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="you@example.com" required>
          </div>%s
          <div class="form-group">
            <label for="message">Message</label>
            <textarea id="message" name="message" placeholder="Tell us what's going on..." required></textarea>
          </div>
          <button class="btn btn-primary btn-block" type="submit">Send Message</button>
          <p class="form-note">%s</p>
        </form>
        <div class="form-success" role="status">%s Thanks — we received your message and will be in touch shortly. For anything urgent, please call %s.</div>
      </div>""" % (heading, fields_extra, action_note, icon("check-circle", 20), PHONE)


def render_map():
    return """      <div class="map-frame" data-reveal="left">
        <iframe src="https://maps.google.com/maps?q=%s&t=&z=14&ie=UTF8&iwloc=&output=embed"
          loading="lazy" referrerpolicy="no-referrer-when-downgrade"
          title="Columbia HVAC Co. location map"></iframe>
      </div>""" % MAP_QUERY


def page_shell(title, desc, depth, active, body_html):
    p = paths_for(depth)
    return """<!DOCTYPE html>
<html lang="en">
<head>
%s
</head>
<body>
%s
%s
%s
%s
</body>
</html>
""" % (render_head(title, desc, depth), render_topbar(depth), render_header(depth, active), body_html, render_footer(depth))

print("partials loaded OK")

# ---------------------------------------------------------------------------
# Article body renderer (used by service detail pages)
# ---------------------------------------------------------------------------
def render_article_body(blocks):
    out = []
    for kind, content in blocks:
        if kind == "h2":
            out.append("        <h2>%s</h2>" % content)
        elif kind == "p":
            out.append("        <p>%s</p>" % content)
        elif kind == "ul":
            items = "\n".join("          <li>%s</li>" % li for li in content)
            out.append("        <ul>\n%s\n        </ul>" % items)
        elif kind == "callout":
            out.append('        <div class="callout">%s<p>%s</p></div>' % (icon("alert", 22), content))
    return "\n".join(out)


def service_card(s, depth, photo=None):
    p = paths_for(depth)
    if photo:
        image_html = real_photo(photo, depth=depth, ar="4/3")
    else:
        image_html = '<div class="img-placeholder img-placeholder--wide" style="--ar:4/3;"><div class="ph-inner">%s<span class="ph-label">Photo: %s — Columbia, MO</span></div></div>' % (icon("camera", 26), s["nav"])
    return """        <a class="service-card" href="%s%s" data-reveal="scale">
          %s
          <div class="card-body">
            <span class="icon-square" style="margin-bottom:4px;">%s</span>
            <h3>%s</h3>
            <p>%s</p>
            <span class="link-arrow">Learn More <span class="icon-circle">%s</span></span>
          </div>
        </a>""" % (p["svc"], s["file"], image_html, icon(s["icon"], 24), s["nav"], s["card_blurb"], icon("arrow-up-right", 14))


# ---------------------------------------------------------------------------
# HOME PAGE
# ---------------------------------------------------------------------------
def build_home():
    depth = 0
    cards = "\n".join(service_card(s, depth, photo=SERVICE_CARD_PHOTOS.get(s["slug"])) for s in SERVICES)
    why_items = [
        ("award", "Best HVAC Company in Columbia", "Years of experience serving residential and commercial customers throughout the Columbia, MO area."),
        ("users", "Highly Trained HVAC Technicians", "Our technicians are continually trained and certified to work on every major HVAC brand."),
        ("alert", "Emergency HVAC Service Available", "24/7 availability with no extra fees for nights, weekends, or holidays."),
        ("dollar", "Affordable HVAC Solutions", "Free estimates, seasonal discounts, service coupons, and financing options."),
        ("thermometer", "Reliable Heating and Cooling Service", "Fast response, accurate diagnostics, and quality workmanship on every job."),
    ]
    why_cards = "\n".join(
        '''        <div class="dark-card" data-reveal="scale">
          <span class="icon-square">%s</span>
          <h4>%s</h4>
          <p>%s</p>
        </div>''' % (icon(ic, 24), title, desc) for ic, title, desc in why_items
    )

    hero_media = real_photo("hero-ac-service", depth=depth, extra_style="border-radius:0;")

    body = """  <section class="hero">
    <div class="hero-media">
      %s
    </div>
    <div class="hero-content">
      <div class="container">
        <div class="hero-grid">
          <div class="hero-copy">
            <span class="eyebrow eyebrow--on-dark">%s WELCOME TO COLUMBIA HVAC CO.</span>
            <h1>Reliable Heating &amp; Cooling Service You Can Trust</h1>
            <p class="lead">Providing affordable, reliable heating, cooling, and indoor air quality services to homeowners and businesses throughout Columbia, MO for many years.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="tel:%s">%s Call %s</a>
              <a class="play-link" href="contact.html">
                <span class="play-btn">%s</span> Get a Free Estimate
              </a>
            </div>
            <div class="hero-checklist">
              <div class="check-item">%s<span class="check-dot">%s</span> 24/7 Emergency Service Available</div>
              <div class="check-item">%s<span class="check-dot">%s</span> Certified HVAC Technicians on Every Brand</div>
              <div class="check-item"><span class="check-dot">%s</span> Free Estimates on New System Installations</div>
            </div>
          </div>
          <div class="hero-badge-card" data-reveal="right">
            <h4>Family-Owned &amp; Operated</h4>
            <p>Multiple generations of Columbia families trust us for their heating and cooling needs.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="trust-strip section-tight">
    <div class="container">
      <div class="trust-item"><span class="icon-circle">%s</span> HomeAdvisor 5-Star Rated</div>
      <div class="trust-item"><span class="icon-circle">%s</span> Serving Columbia, MO &amp; Surrounding Areas</div>
      <div class="trust-item"><span class="icon-circle">%s</span> 24/7 Emergency Availability</div>
      <div class="trust-item"><span class="icon-circle">%s</span> 100%% Satisfaction Guarantee</div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="section-head text-center mx-auto" data-reveal="fade">
        <span class="eyebrow" style="justify-content:center;">OUR SERVICES</span>
        <h2>Complete Heating &amp; Cooling Services</h2>
        <p>Seasonal tune-ups, ductwork service, indoor air quality, emergency repair, furnace repair, heat pump service, and A/C repair — for residential and commercial customers.</p>
      </div>
      <div class="grid grid-3" data-reveal-group>
%s
      </div>
    </div>
  </section>

  <section class="bg-dark">
    <div class="container">
      <div class="section-head text-center mx-auto" data-reveal="fade">
        <span class="eyebrow eyebrow--on-dark" style="justify-content:center;">WHY CHOOSE US</span>
        <h2>Why Choose Columbia HVAC Company?</h2>
        <p style="color:rgba(255,255,255,0.62);">We focus on fast response, accurate diagnostics, and quality workmanship on every heating and cooling job we take on.</p>
      </div>
      <div class="grid grid-3" data-reveal-group>
%s
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="split-section">
        <div data-reveal="left">
          <div class="photo-collage">
            <div class="collage-dots collage-dots--tr"></div>
            %s
            %s
            %s
            %s
            <div class="collage-dots collage-dots--bl"></div>
          </div>
        </div>
        <div data-reveal="right">
          <span class="eyebrow">FAMILY-OWNED &amp; LOCAL</span>
          <h2>Serving Columbia Families &amp; Businesses for Many Years</h2>
          <p style="margin-top:16px;color:var(--color-text-muted);">Our service team has won awards for exemplary service, and every job is backed by a 100%% satisfaction guarantee. We work hard to keep our prices fair and our scheduling easy — call, text, email, or use our web form.</p>
          <div class="feature-row" style="margin-top:30px;">
            <span class="icon-square">%s</span>
            <div><h4>Certified on Every Brand</h4><p>Our technicians are qualified and certified to service all major HVAC brands.</p></div>
          </div>
          <div class="feature-row">
            <span class="icon-square">%s</span>
            <div><h4>100%% Satisfaction Guarantee</h4><p>If you're not satisfied, we'll make it right — including a full refund.</p></div>
          </div>
          <div class="mini-checklist">
            <div class="check-item"><span class="check-dot">%s</span> Free Estimates</div>
            <div class="check-item"><span class="check-dot">%s</span> Financing Options Available</div>
            <div class="check-item"><span class="check-dot">%s</span> Seasonal Discounts &amp; Coupons</div>
          </div>
          <a class="btn btn-dark" href="about.html">Read More About Us</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section-tight">
    <div class="container">
      <div class="cta-banner" data-reveal="scale">
        <div>
          <h2>Ready for Fast, Reliable HVAC Service?</h2>
          <p>Our operator is standing by — we can often have someone to your house the same day. Call now or request a free estimate.</p>
        </div>
        <div class="cta-actions">
          <a class="btn btn-white" href="tel:%s">%s Call %s</a>
          <a class="btn btn-outline btn-outline--on-dark" href="contact.html">Request a Free Estimate</a>
        </div>
      </div>
    </div>
  </section>

  <section id="get-estimate" class="bg-cream">
    <div class="container">
      <div class="grid grid-2" style="align-items:start;">
        <div data-reveal="left">
          <span class="eyebrow">GET IN TOUCH</span>
          <h2>Contact Columbia HVAC Co.</h2>
          <p style="margin:16px 0 26px;color:var(--color-text-muted);">Our operator is standing by to take your call! We can often have someone to your house the same day.</p>
          <div class="contact-info-card">
            <h3>Contact Info</h3>
            <div class="contact-info-row"><span class="icon-circle">%s</span><span><strong>Address</strong>%s</span></div>
            <div class="contact-info-row"><span class="icon-circle">%s</span><span><strong>Phone</strong><a href="tel:%s">%s</a></span></div>
            <div class="contact-info-row"><span class="icon-circle">%s</span><span><strong>Availability</strong>24/7 emergency service</span></div>
          </div>
        </div>
%s
      </div>
    </div>
  </section>
""" % (
        hero_media,
        icon("flame", 14), PHONE_TEL, icon("phone", 16), PHONE, icon("play", 18),
        icon("check", 12), icon("check", 12), icon("check", 12), icon("check", 12), icon("check", 12),
        icon("star", 22), icon("pin", 22), icon("clock", 22), icon("shield", 22),
        cards,
        why_cards,
        real_photo("furnace-install", depth=depth),
        real_photo("technician-furnace-indoor", depth=depth),
        real_photo("rooftop-units", depth=depth),
        real_photo("thermostat", depth=depth),
        icon("shield", 24), icon("check-circle", 24),
        icon("check", 12), icon("check", 12), icon("check", 12),
        PHONE_TEL, icon("phone", 18), PHONE,
        icon("pin", 18), ADDRESS, icon("phone", 18), PHONE_TEL, PHONE, icon("clock", 18),
        render_lead_form(depth, "Send Us a Message", compact=True),
    )
    return page_shell(
        "HVAC Columbia MO | Furnace &amp; A/C Repair | Columbia HVAC Co.",
        "Columbia HVAC Co. provides affordable, reliable heating, cooling, and indoor air quality services in Columbia, MO. 24/7 emergency service, free estimates. Call 573-204-6161.",
        depth, "home", body
    )

print("home builder loaded")

# ---------------------------------------------------------------------------
# ABOUT PAGE
# ---------------------------------------------------------------------------
def build_about():
    depth = 0
    root = paths_for(depth)["root"]
    reasons = [
        "Many years serving Columbia's residential and commercial clients.",
        "Our service team has won awards for exemplary service.",
        "Quality work backed by a 100% satisfaction guarantee.",
        "Fair prices to meet your budget.",
        "24/7 availability — call for quick service.",
    ]
    reason_items = "\n".join(
        '''        <div class="reason-item" data-reveal="fade">
          <span class="reason-num">%02d</span>
          <div><h4>Reason %d</h4><p>%s</p></div>
        </div>''' % (i + 1, i + 1, r) for i, r in enumerate(reasons)
    )

    expect = [
        ("shield", "Certified on All Brands", "Our technicians are qualified and certified to work on all major HVAC brands."),
        ("check-circle", "100% Satisfaction Guarantee", "If you're not satisfied, we'll make it right — including a full refund."),
        ("clock", "24/7 Emergency Service", "Available around the clock with no extra weekend or weekday fees."),
        ("users", "Family-Owned &amp; Operated", "Columbia HVAC Co. is proud to be a family-owned local business."),
        ("award", "Continuous Technician Training", "Our team keeps learning to stay current on every HVAC system and brand."),
        ("dollar", "Annual Service Agreements", "Agreements available to keep your system running smoothly year-round."),
        ("sparkle", "Shoe Covers &amp; Clean-Up", "Our technicians wear shoe covers and clean up after every job."),
        ("tool", "Fixed Right, Guaranteed", "Repairs done correctly the first time, or the repair service is free."),
    ]
    expect_cards = "\n".join(
        '''        <div class="pill-card" data-reveal="scale">
          <span class="icon-circle">%s</span>
          <p>%s</p>
        </div>''' % (icon(ic, 22), "<strong style='display:block;color:var(--color-dark);'>%s</strong>%s" % (t, d)) for ic, t, d in expect
    )

    body = """  <section class="page-hero">
    <div class="img-placeholder" style="--ar:16/9;"><div class="ph-inner"></div></div>
    <div class="container">
      <h1>About Us</h1>
      <div class="breadcrumb"><a href="index.html">Home</a><span class="sep">/</span><span class="current">About Us</span></div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="split-section">
        <div data-reveal="left">
          <span class="eyebrow">5 REASONS TO CHOOSE US</span>
          <h2>Top 5 Reasons to Contact Columbia HVAC Co.</h2>
          <p style="margin:16px 0 30px;color:var(--color-text-muted);">Columbia HVAC Co. is a family-owned company providing heating, cooling, and indoor air quality services to homeowners and businesses in Columbia, MO.</p>
          <div class="reason-list">
%s
          </div>
        </div>
        <div class="brand-panel" data-reveal="right">
          <div class="collage-dots collage-dots--tr"></div>
          <img class="brand-panel-logo" src="%sassets/logo/columbia-hvac-logo.png" alt="Columbia HVAC Co. logo">
          <p class="brand-panel-tagline">Family-owned and proudly serving Columbia, MO and the surrounding area for many years.</p>
          <div class="brand-panel-badges">
            <span>%s 24/7 Emergency Service</span>
            <span>%s 100%% Satisfaction Guarantee</span>
          </div>
          <div class="collage-dots collage-dots--bl"></div>
        </div>
      </div>
    </div>
  </section>

  <section class="bg-cream">
    <div class="container">
      <div class="section-head text-center mx-auto" data-reveal="fade">
        <span class="eyebrow" style="justify-content:center;">WHAT YOU CAN EXPECT</span>
        <h2>Backed by Real Guarantees</h2>
      </div>
      <div class="pill-grid" data-reveal-group>
%s
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="cta-banner" data-reveal="scale">
        <div>
          <h2>Have Questions About Our Team?</h2>
          <p>Reach out any time — our operator is standing by and can often have someone out the same day.</p>
        </div>
        <div class="cta-actions">
          <a class="btn btn-white" href="tel:%s">%s Call %s</a>
          <a class="btn btn-outline btn-outline--on-dark" href="contact.html">Contact Us</a>
        </div>
      </div>
    </div>
  </section>

  <section id="get-estimate" class="bg-cream">
    <div class="container">
      <div class="grid grid-2" style="align-items:start;">
        <div data-reveal="left">
          <span class="eyebrow">GET IN TOUCH</span>
          <h2>Visit or Call Us</h2>
          <div class="contact-info-card" style="margin-top:20px;">
            <h3>Contact Info</h3>
            <div class="contact-info-row"><span class="icon-circle">%s</span><span><strong>Address</strong>%s</span></div>
            <div class="contact-info-row"><span class="icon-circle">%s</span><span><strong>Phone</strong><a href="tel:%s">%s</a></span></div>
          </div>
        </div>
%s
      </div>
    </div>
  </section>
""" % (
        reason_items,
        root, icon("check-circle", 16), icon("check-circle", 16),
        expect_cards,
        PHONE_TEL, icon("phone", 18), PHONE,
        icon("pin", 18), ADDRESS, icon("phone", 18), PHONE_TEL, PHONE,
        render_lead_form(depth, "Send Us a Message", compact=True),
    )
    return page_shell(
        "About | HVAC Company in Columbia, MO | Columbia HVAC Co.",
        "Family-owned and operated, Columbia HVAC Co. has served Columbia, MO homeowners and businesses for many years with a 100% satisfaction guarantee.",
        depth, "about", body
    )


# ---------------------------------------------------------------------------
# CONTACT PAGE
# ---------------------------------------------------------------------------
def build_contact():
    depth = 0
    area_tags = "\n".join("          <span>%s</span>" % a for a in AREAS)
    body = """  <section class="page-hero">
    <div class="img-placeholder" style="--ar:16/9;"><div class="ph-inner"></div></div>
    <div class="container">
      <h1>Contact Us</h1>
      <div class="breadcrumb"><a href="index.html">Home</a><span class="sep">/</span><span class="current">Contact</span></div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="section-head text-center mx-auto" data-reveal="fade">
        <span class="eyebrow" style="justify-content:center;">CONTACT US</span>
        <h2>Get in Touch for Fast, Reliable HVAC Support</h2>
        <p>Our operator is standing by to take your call! We can often have someone to your house the same day.</p>
      </div>

      <div class="grid grid-2" style="align-items:start;">
        <div data-reveal="left" style="display:flex;flex-direction:column;gap:24px;">
          <div class="contact-info-card">
            <h3>Contact Info</h3>
            <div class="contact-info-row"><span class="icon-circle">%s</span><span><strong>Address</strong>%s</span></div>
            <div class="contact-info-row"><span class="icon-circle">%s</span><span><strong>Phone</strong><a href="tel:%s">%s</a></span></div>
            <div class="contact-info-row"><span class="icon-circle">%s</span><span><strong>Facebook</strong><a href="%s" target="_blank" rel="noopener">Follow us</a></span></div>
          </div>
          <div class="sidebar-card">
            <h4>We Proudly Serve</h4>
            <p style="color:var(--color-text-muted);font-size:0.92rem;margin-bottom:6px;">Columbia, MO and surrounding areas, including:</p>
            <div class="area-tags">
%s
            </div>
          </div>
        </div>
%s
      </div>
    </div>
  </section>

  <section class="section-tight bg-cream">
    <div class="container">
%s
    </div>
  </section>
""" % (
        icon("pin", 18), ADDRESS,
        icon("phone", 18), PHONE_TEL, PHONE,
        icon("facebook", 18), FACEBOOK,
        area_tags,
        render_lead_form(depth, "Send Us a Message"),
        render_map(),
    )
    return page_shell(
        "Contact | HVAC Company in Columbia, MO | Columbia HVAC Co.",
        "Contact Columbia HVAC Co. at 573-204-6161 or 1403 W Ash St, Columbia, MO 65203. Serving Columbia and surrounding areas.",
        depth, "contact", body
    )


# ---------------------------------------------------------------------------
# SERVICES HUB PAGE
# ---------------------------------------------------------------------------
def build_services_index():
    depth = 1
    cards = "\n".join(service_card(s, depth) for s in SERVICES)
    body = """  <section class="page-hero">
    <div class="img-placeholder" style="--ar:16/9;"><div class="ph-inner"></div></div>
    <div class="container">
      <h1>Our Services</h1>
      <div class="breadcrumb"><a href="../index.html">Home</a><span class="sep">/</span><span class="current">Services</span></div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="section-head text-center mx-auto" data-reveal="fade">
        <span class="eyebrow" style="justify-content:center;">COMPLETE HVAC SERVICES</span>
        <h2>Heating &amp; Cooling Services for Homes &amp; Businesses</h2>
        <p>Columbia HVAC Co. serves residential and commercial customers throughout Columbia, MO with certified technicians, free estimates, and a 100%% satisfaction guarantee.</p>
      </div>
      <div class="grid grid-3" data-reveal-group>
%s
      </div>
    </div>
  </section>

  <section class="bg-cream section-tight">
    <div class="container">
      <div class="cta-banner" data-reveal="scale">
        <div>
          <h2>Not Sure Which Service You Need?</h2>
          <p>Call us and describe the problem — we'll help you figure out the right next step.</p>
        </div>
        <div class="cta-actions">
          <a class="btn btn-white" href="tel:%s">%s Call %s</a>
          <a class="btn btn-outline btn-outline--on-dark" href="../contact.html">Request a Free Estimate</a>
        </div>
      </div>
    </div>
  </section>
""" % (cards, PHONE_TEL, icon("phone", 18), PHONE)
    return page_shell(
        "Services | HVAC Company in Columbia, MO | Columbia HVAC Co.",
        "Furnace repair, air conditioning repair, air duct cleaning, emergency HVAC service, and more — serving Columbia, MO homes and businesses.",
        depth, "services", body
    )


# ---------------------------------------------------------------------------
# SERVICE DETAIL PAGES
# ---------------------------------------------------------------------------
def build_service_detail(s):
    depth = 1
    main_photo_key = SERVICE_CARD_PHOTOS.get(s["slug"])
    others = [o for o in SERVICES if o["slug"] != s["slug"]]
    sidebar_links = "\n".join(
        '            <a href="%s" class="%s">%s %s</a>' % (
            o["file"], "is-active" if o["slug"] == s["slug"] else "", o["nav"], icon("arrow-up-right", 14)
        ) for o in SERVICES
    )
    related = "\n".join(
        service_card(o, depth, photo=SERVICE_CARD_PHOTOS.get(o["slug"])) for o in others[:3]
    )

    body = """  <section class="page-hero">
    <div class="img-placeholder" style="--ar:16/9;"><div class="ph-inner"></div></div>
    <div class="container">
      <h1>%s</h1>
      <div class="breadcrumb"><a href="../index.html">Home</a><span class="sep">/</span><a href="index.html">Services</a><span class="sep">/</span><span class="current">%s</span></div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="service-layout">
        <article class="article-body" data-reveal="left">
          %s
%s
        </article>

        <aside class="service-sidebar" data-reveal="right">
          <div class="sidebar-card">
            <h4>All Services</h4>
            <nav class="sidebar-nav">
%s
            </nav>
          </div>
          <div class="sidebar-card sidebar-cta">
            <span class="icon-circle" style="background:rgba(240,152,63,0.18);color:var(--color-flame-400);margin:0 auto 14px;">%s</span>
            <h4>Need %s?</h4>
            <p>Our operator is standing by — call now or request a free estimate.</p>
            <a class="btn btn-primary btn-block" href="tel:%s">Call %s</a>
            <a class="btn btn-outline btn-outline--on-dark btn-block" style="margin-top:10px;" href="../contact.html">Request a Free Estimate</a>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <section class="bg-cream">
    <div class="container">
      <div class="section-head" data-reveal="fade">
        <span class="eyebrow">RELATED SERVICES</span>
        <h2>You Might Also Need</h2>
      </div>
      <div class="related-grid" data-reveal-group>
%s
      </div>
    </div>
  </section>

  <section id="get-estimate">
    <div class="container">
      <div class="grid grid-2" style="align-items:start;">
        <div data-reveal="left">
          <span class="eyebrow">FREE ESTIMATE</span>
          <h2>Request Service</h2>
          <p style="margin:16px 0 26px;color:var(--color-text-muted);">Tell us what's going on and we'll follow up quickly — often the same day.</p>
          <div class="contact-info-card">
            <h3>Contact Info</h3>
            <div class="contact-info-row"><span class="icon-circle">%s</span><span><strong>Address</strong>%s</span></div>
            <div class="contact-info-row"><span class="icon-circle">%s</span><span><strong>Phone</strong><a href="tel:%s">%s</a></span></div>
          </div>
        </div>
%s
      </div>
    </div>
  </section>
""" % (
        s["title"], s["nav"],
        real_photo(main_photo_key, depth=depth, ar="16/9", extra_style="margin-bottom:34px;") if main_photo_key
            else '<div class="img-placeholder img-placeholder--wide" style="margin-bottom:34px;"><div class="ph-inner">%s<span class="ph-label">Photo: %s in Columbia, MO</span></div></div>' % (icon("camera", 26), s["nav"]),
        render_article_body(s["body"]),
        sidebar_links,
        icon(s["icon"], 26), s["nav"],
        PHONE_TEL, PHONE,
        related,
        icon("pin", 18), ADDRESS, icon("phone", 18), PHONE_TEL, PHONE,
        render_lead_form(depth, "Send Us a Message", compact=True),
    )
    return page_shell(s["meta_title"], s["meta_desc"], depth, s["slug"], body)

print("about/contact/services builders loaded")

# ---------------------------------------------------------------------------
# Write files
# ---------------------------------------------------------------------------
def write(path, content):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print("wrote", path, len(content), "bytes")

write("index.html", build_home())
write("about.html", build_about())
write("contact.html", build_contact())
write("services/index.html", build_services_index())
for s in SERVICES:
    write("services/" + s["file"], build_service_detail(s))

print("\nDONE. Files:")
for r, d, files in os.walk(ROOT):
    for fn in files:
        if fn.endswith(".html"):
            print(" ", os.path.relpath(os.path.join(r, fn), ROOT))
