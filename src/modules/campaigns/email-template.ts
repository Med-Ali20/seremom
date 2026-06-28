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
      ? `<tr><td style="padding:8px 0 24px;">
          <a href="${ctaUrl}" style="color:#3f2230; text-decoration:underline; font-size:15px; font-weight:600;">
            ${ctaLabel} &rarr;
          </a>
        </td></tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${subject}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">
  <tr><td style="padding:0 4px 20px; font-size:13px; color:#888888;">
    Seremom
  </td></tr>
  <tr><td style="padding:0 4px 16px; font-size:18px; line-height:1.4; color:#222222; font-weight:600;">
    ${subject}
  </td></tr>
  <tr><td style="padding:0 4px 8px; font-size:15px; line-height:1.7; color:#333333;">
    ${contentHtml}
  </td></tr>
  ${ctaRow}
  <tr><td style="padding:24px 4px 0; border-top:1px solid #eeeeee; font-size:12px; color:#999999; line-height:1.6;">
    ${companyAddress ? `${companyAddress}<br>` : ''}
    <a href="${unsubscribeUrl}" style="color:#999999; text-decoration:underline;">Unsubscribe</a>
    ${viewInBrowserUrl ? ` &middot; <a href="${viewInBrowserUrl}" style="color:#999999; text-decoration:underline;">View in browser</a>` : ''}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}