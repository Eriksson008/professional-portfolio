// Sends a person from the share wrapper into the Ask Fredrik dashboard.
// Crawlers do not run scripts, so they stay on share.html and read its Open
// Graph tags - which is the entire reason the redirect lives here instead of in
// a <meta refresh> or an HTTP 302. Either of those would be followed by several
// unfurlers, landing them on the Cloudflare Access login page with nothing to
// preview.
//
// `replace` rather than `assign`: the wrapper should not sit in history, or
// Back from the dashboard returns here and immediately bounces forward again.
window.location.replace("/admin/ask-fredrik/");
