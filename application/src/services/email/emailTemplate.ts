/**
 * Generates a branded HTML email template with a blue banner and centered title.
 * The template uses tables and inline styles for maximum compatibility with email clients.
 *
 * @param {Object} params - The template parameters.
 * @param {string} params.title - The title to display in the banner (displayed as part of the header).
 * @param {string} params.content - The main HTML content of the email body.
 * @returns {string} The complete HTML string for the email.
 */
export function emailTemplate({ title, content }: { title: string; content: string }): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; margin:0; padding:0;">
    <tr>
        <td>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
            <td align="center" bgcolor="#0061EB" style="padding: 48px 0 36px 0;">
                <h1 style="color: #fff; margin: 0; font-size: 1.5rem; font-family: Arial, Helvetica, sans-serif;">SeaStocks - ${title}</h1>
            </td>
            </tr>
            <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" border="0" style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px margin: 32px auto; padding: 0;">
                <tr>
                    <td style="padding: 32px 24px; color: #222; font-size: 16px; line-height: 1.6;">
                        ${content}
                    </td>
                </tr>
                </table>
            </td>
            </tr>
        </table>
        </td>
    </tr>
    </table>
  `;
}
