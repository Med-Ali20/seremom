interface ShellArgs {
  subject: string;
  contentHtml: string;
  unsubscribeUrl: string;
  viewInBrowserUrl?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  companyAddress?: string;
}

export function renderEmailShell({
  subject,
  contentHtml,
  unsubscribeUrl,
  viewInBrowserUrl,
  ctaUrl,
  ctaLabel,
  companyAddress,
}: ShellArgs): string {
  const ctaRow =
    ctaUrl && ctaLabel
      ? `<tr><td style="padding:8px 40px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="border-radius:999px; background-color:#3f2230;">
              <a href="${ctaUrl}" style="display:inline-block; padding:13px 28px; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:999px;">
                ${ctaLabel}
              </a>
            </td></tr>
          </table>
        </td></tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#feeef1; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<style>
  .content h2 { font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #3f2230; font-weight: normal; margin: 24px 0 12px; line-height: 1.3; }
  .content p { font-size: 15px; line-height: 1.7; color: #4d4d4d; margin: 0 0 16px; }
  .content ul, .content ol { margin: 0 0 16px; padding-left: 20px; }
  .content li { font-size: 15px; line-height: 1.7; color: #4d4d4d; margin-bottom: 6px; }
  .content a { color: #E50F3A; text-decoration: underline; }
  .content strong { color: #3f2230; }
</style>
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${subject}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#feeef1;">
<tr><td align="center" style="padding: 32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden;">
  <tr><td style="background-color:#feeef1; padding:36px 40px 28px;">
    <p style="margin:0 0 16px; font-size:11px; font-weight:600; letter-spacing:0.2em; text-transform:uppercase; color:#ff6384;">SEREMOM NEWSLETTER</p>
    <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:28px; line-height:1.3; color:#3f2230; font-weight:normal;">${subject}</h1>
    <div style="width:48px; height:2px; background-color:#ff6384; margin:20px 0 0;"></div>
  </td></tr>
  <tr><td class="content" style="padding:32px 40px 8px;">
    ${contentHtml}
  </td></tr>
  ${ctaRow}
  <tr><td style="background-color:#FFF5F7; padding:32px 40px; text-align:center; border-top:1px solid #f0dde2;">
    <p style="margin:0 0 4px; font-family:Georgia,'Times New Roman',serif; font-style:italic; font-size:15px; color:#6b2737;">Educate. Connect. Empower.</p>
    <p style="margin:0 0 16px; font-size:12px; color:#8a6a70;">Seremom · Postpartum support community</p>
    ${companyAddress ? `<p style="margin:0 0 8px; font-size:11px; color:#b8a0a6;">${companyAddress}</p>` : ''}
    <p style="margin:0; font-size:12px;">
      <a href="${unsubscribeUrl}" style="color:#b5596a; text-decoration:underline;">Unsubscribe</a>
      ${viewInBrowserUrl ? `<span style="color:#d4a0aa;"> · </span><a href="${viewInBrowserUrl}" style="color:#b5596a; text-decoration:underline;">View in browser</a>` : ''}
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}