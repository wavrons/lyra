1. The Vault (Details Page)
Purpose: The "Truth" layer. This is the structured backbone of the trip.
• Key Features:
• The "Flex-Date" Toggle: Switch between "Fixed Dates" (Calendar picker) and "Duration Mode" (e.g., "7 Nights").
• Logic Blocks: Specific fields for Flight #, Confirmation #, and Hotel Address.
• Attachment Repository: A simple list of PDFs/Receipts (Museum tickets, etc.).
• Connections:
• Feeds: The date range/duration to the Itinerary View.
• Pulls: Booking addresses to populate the map in the Itinerary View.
• Don't Do (Anti-Features):
• Do not make it a full expense tracker. Don't add tax calculators or currency converters yet; keep it to "What am I doing and when?"
2. The Sandbox (The Board)
Purpose: The "Chaos" layer. A place for visual and textual inspiration before it’s scheduled.
• Key Features:
• Masonry Grid: A Pinterest-style layout for images, links, and text notes.
• Link Scraper: When you paste a link (e.g., a TripAdvisor page), it automatically pulls the thumbnail and title.
• "Bucket" Logic: Items here are "Unscheduled."
• Connections:
• Feeds: Every item here is a "Draggable" component for the Itinerary View.
• Don't Do (Anti-Features):
• Do not add a "Social Feed." This should be a private scrapbooking space. Don't worry about "Likes" or "Comments."
3. The Weaver (Itinerary View)
Purpose: The "Bridge." Where the Sandbox meets the Vault.
• Key Features:
• Dual-Pane UI: The Board items on the left, the Timeline on the right.
• Smart Timeline: If the trip is "Flexible," Days are labeled "Day 1, Day 2" instead of dates.
• "Publish" Toggle: A button that generates a unique, obscured URL (e.g., stargate.app/v/3f8j2-x91).
• Connections:
• Pulls: Data from both the Vault and the Board.
• Don't Do (Anti-Features):
• Do not build your own map routing. Just provide a button that says "Open in Google Maps."
4. The Portal (Public View)
Purpose: The "Read-Only" Output. This is what you send to friends.
• Key Features:
• No Auth: Access via a unique hash in the URL.
• Mobile-First Design: Optimized for a traveler walking down a street in Tokyo looking for their next stop.
• "Save as PDF": A simple way for the viewer to keep a copy.
• Don't Do (Anti-Features):
• Do not allow editing here. Any changes must happen in the logged-in app.

data flow logic:
\bm{\text{Sandbox (Chaos)} + \text{Vault (Constraints)} \xrightarrow{\text{Drag \& Drop}} \text{Itinerary (Order)}}

openapis
- open streetmap
- leaflet
- microlink.io
- open weather map
- amadeus (Testtier)



1. The Details Tab (The Logbook)
This page should feel like filling out a high-end passport application—organized and authoritative.
UI Components:
• Trip Meta Card: A top section with a "Cover Image" (use Unsplash API) and a "Flex-Toggle."
• Toggle Left: Specific Dates (Calendar Picker).
• Toggle Right: Duration Only (Number Input for "Nights").
• Logistics Grid: 3-column layout of small cards:
• Flight: Inputs for Flight #, Airline, and Status.
• Stay: Input for Hotel Name, Address (with a "Map it" link), and Check-in time.
• Transport: Train/Car rental notes.
• Document Vault: A "Dropzone" component where you can drag PDFs or images (receipts). Show them as mini thumbnails with a "View Full" button.
The "Add Detail" Pop-up Logic:
1. Trigger: Click a "＋" on any empty category card.
2. The Modal: A centered overlay with a Category Selector (Flight, Stay, Document).
3. Dynamic Fields: If "Flight" is chosen, show an input that triggers a Flight Search API. If "Stay," show a Google Places autocomplete box.
2. The Board Tab (The Sandbox)
This is your "Pinterest" zone. It should be a Masonry Grid (staggered columns) to handle different image sizes and text lengths.
UI Components:
• The Clipper: A prominent "Paste Link" input at the top.
• Inspiration Cards: Each card contains:
• A "Handle" for dragging (Crucial for the Itinerary tab later).
• Image/Thumbnail.
• Title and a "Delete" icon that only appears on hover.
• Rich Text Sticky: A "Post-it" style card for typing random thoughts or "Things to remember."
• a side panel to show weblinks that overlays from the right side of the screen.
The "Add Item" Pop-up Logic:
1. Trigger: Clicking the "Add POI" button seen in your screenshot.
2. The Modal: Three big icons: [Link] [Image] [Note].
3. The Workflow: * If Link: Paste URL -> API fetches the "OpenGraph" image and title -> Card is created instantly.
• If Note: Opens a simple markdown editor.
3. The Itinerary Tab (The Weaver)
This is the most complex page. It needs a Split-View or a Side-Drawer to facilitate drag-and-drop.
UI Components:
• The Sidebar (The Stash): A narrow vertical column on the left showing all the items you created in the Board tab.
• The Timeline: A series of "Day Containers."
• If "Fixed Dates": "Monday, Oct 12".
• If "Flexible": "Day 1", "Day 2".
• Drop-Zones: Empty slots between items to allow re-ordering.
• The "Publish" Footer: A sticky bar at the bottom with a "Generate Public Link" button.
The "Public Link" Logic:
1. Trigger: Click "Generate Link."
2. The Modal: Displays a URL like lyra.travel/p/tokyo-2026-x8z.
3. The Feature: A toggle for "Show/Hide Receipts"—you want your friends to see the itinerary, but maybe not your flight prices or confirmation numbers.

<div class="app-layout" style="display: flex;">
  
  <aside class="sidebar">...</aside>

  <main class="content">
    
    <header class="trip-header">
      <h1>2026 Tokyo</h1>
      <button class="btn-publish">Share Trip</button>
    </header>

    <section class="tab-view-itinerary" style="display: grid; grid-template-columns: 300px 1fr;">
      
      <div class="stash-column">
        <h3>Unscheduled</h3>
        <div class="draggable-card" draggable="true">Ramen Shop</div>
      </div>

      <div class="timeline-column">
        <div class="day-bucket" ondrop="drop(event)">
          <h2>Day 1</h2>
          </div>
      </div>

    </section>
  </main>
</div>
