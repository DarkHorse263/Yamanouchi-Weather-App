import { sendEmail } from "./emailSender.js";
import { accountDeletedEmail } from "./emailTemplates.js";

type DeletionReceiptSender = (args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: string;
}) => Promise<unknown>;

/**
 * Dispatch the former member's deletion receipt without delaying or changing
 * the account-deletion response. Provider failures are logged only.
 */
export function sendAccountDeletionReceipt(
  email: string,
  sender: DeletionReceiptSender = sendEmail,
): void {
  const receipt = accountDeletedEmail();
  void sender({
    to: email,
    subject: receipt.subject,
    html: receipt.html,
    text: receipt.text,
    tag: "account-deleted",
  }).catch((mailErr: unknown) => {
    console.error("[/account DELETE] deletion receipt send failed (non-fatal):", mailErr);
  });
}