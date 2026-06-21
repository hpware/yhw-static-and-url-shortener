import { authenticateRequest } from "@/components/api-auth";
import { db } from "@/components/drizzle/db";
import { apiKeys } from "@/components/drizzle/schema";
import { eq } from "drizzle-orm";

export const GET = async (req: Request) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const shortenerUrl = process.env.NEXT_PUBLIC_URL_SHORTENER_URL || "http://localhost:3000";

    const userKeys = await db.select().from(apiKeys).where(eq(apiKeys.userId, auth.userId));
    const apiKey = userKeys[0]?.key || "YOUR_API_KEY";

    const agentMd = `# yhM Agent Configuration

## API Key
\`\`\`
${apiKey}
\`\`\`

## Base URLs
- Admin API: ${adminUrl}
- Site URL: ${siteUrl}
- Shortener URL: ${shortenerUrl}

## Authentication
Include your API key in all requests:
\`\`\`
x-api-key: ${apiKey}
\`\`\`

## Endpoints

### Create Short URL
\`\`\`bash
curl -X POST ${adminUrl}/api/shortener/create \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"url": "https://example.com", "slug": "my-link", "name": "My Link"}'
\`\`\`

### List Short URLs
\`\`\`bash
curl ${adminUrl}/api/shortener/get_all_links \\
  -H "x-api-key: ${apiKey}"
\`\`\`

### Edit Short URL
\`\`\`bash
curl -X POST ${adminUrl}/api/shortener/edit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"id": "UUID_HERE", "destination": "https://new-url.com"}'
\`\`\`

### Delete Short URL
\`\`\`bash
curl -X POST ${adminUrl}/api/shortener/delete \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{"id": "UUID_HERE"}'
\`\`\`

### Get Analytics
\`\`\`bash
curl ${adminUrl}/api/analytics/home \\
  -H "x-api-key: ${apiKey}"
\`\`\`

### Create Site
\`\`\`bash
curl -X POST ${adminUrl}/api/sites/create \\
  -H "x-api-key: ${apiKey}" \\
  -F "name=My Site" \\
  -F "slug=my-site" \\
  -F "files=@index.html"
\`\`\`

### List Sites
\`\`\`bash
curl ${adminUrl}/api/sites/list \\
  -H "x-api-key: ${apiKey}"
\`\`\`

### Submit Site (Agent Command)
\`\`\`bash
# Upload a site directory as a zip
curl -X POST ${adminUrl}/api/sites/create \\
  -H "x-api-key: ${apiKey}" \\
  -F "name=my-site" \\
  -F "slug=my-site" \\
  -F "archive=@site.zip"
\`\`\`

Your site will be available at: ${siteUrl}/my-site
`;

    return new Response(agentMd, {
      headers: { "Content-Type": "text/markdown" },
    });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
};
