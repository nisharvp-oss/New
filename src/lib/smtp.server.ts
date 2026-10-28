// Minimal SMTP client (AUTH LOGIN, implicit TLS on 465 or STARTTLS on 587).
import net from "node:net";
import tls from "node:tls";

export type SmtpConfig = {
  host: string; port: number; secure: "tls" | "starttls"; user: string; password: string;
  fromName: string; fromEmail: string;
};
export type Mail = { to: string; subject: string; text: string; html?: string };

type Sock = net.Socket | tls.TLSSocket;

function reader(sock: Sock) {
  let buf = "";
  let waiter: ((s: string) => void) | null = null;
  const onData = (d: Buffer) => {
    buf += d.toString("utf8");
    tryResolve();
  };
  function tryResolve() {
    // A full reply ends with a line "NNN text\r\n" (space after code)
    const lines = buf.split("\r\n");
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^\d{3} /.test(lines[i] ?? "")) {
        const reply = lines.slice(0, i + 1).join("\n");
        buf = lines.slice(i + 1).join("\r\n");
        if (waiter) { const w = waiter; waiter = null; w(reply); }
        return;
      }
    }
  }
  sock.on("data", onData);
  return {
    next: () => new Promise<string>((res, rej) => {
      const t = setTimeout(() => rej(new Error("Mail server did not respond")), 15000);
      waiter = (s) => { clearTimeout(t); res(s); };
      tryResolve();
    }),
    detach: () => sock.off("data", onData),
  };
}

async function cmd(sock: Sock, r: ReturnType<typeof reader>, line: string | null, expect: number[]) {
  if (line !== null) sock.write(line + "\r\n");
  const reply = await r.next();
  const code = Number(reply.slice(0, 3));
  if (!expect.includes(code)) throw new Error(`Mail server said: ${reply.split("\n").pop()}`);
  return reply;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const encHeader = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);

export async function sendMail(cfg: SmtpConfig, mail: Mail): Promise<void> {
  const connect = () => new Promise<Sock>((res, rej) => {
    const s = cfg.secure === "tls"
      ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host }, () => res(s))
      : net.connect({ host: cfg.host, port: cfg.port }, () => res(s));
    s.once("error", rej);
  });
  let sock = await connect();
  let r = reader(sock);
  try {
    await cmd(sock, r, null, [220]);
    await cmd(sock, r, "EHLO wandersync", [250]);
    if (cfg.secure === "starttls") {
      await cmd(sock, r, "STARTTLS", [220]);
      r.detach();
      sock = await new Promise<Sock>((res, rej) => {
        const t = tls.connect({ socket: sock as net.Socket, servername: cfg.host }, () => res(t));
        t.once("error", rej);
      });
      r = reader(sock);
      await cmd(sock, r, "EHLO wandersync", [250]);
    }
    await cmd(sock, r, "AUTH LOGIN", [334]);
    await cmd(sock, r, b64(cfg.user), [334]);
    await cmd(sock, r, b64(cfg.password), [235]);
    await cmd(sock, r, `MAIL FROM:<${cfg.fromEmail}>`, [250]);
    await cmd(sock, r, `RCPT TO:<${mail.to}>`, [250, 251]);
    await cmd(sock, r, "DATA", [354]);
    const boundary = "ws" + Math.random().toString(36).slice(2);
    const headers = [
      `From: ${encHeader(cfg.fromName)} <${cfg.fromEmail}>`,
      `To: <${mail.to}>`,
      `Subject: ${encHeader(mail.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
    ];
    let body: string;
    if (mail.html) {
      headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      body = [`--${boundary}`, "Content-Type: text/plain; charset=utf-8", "Content-Transfer-Encoding: base64", "", b64(mail.text),
        `--${boundary}`, "Content-Type: text/html; charset=utf-8", "Content-Transfer-Encoding: base64", "", b64(mail.html), `--${boundary}--`].join("\r\n");
    } else {
      headers.push("Content-Type: text/plain; charset=utf-8", "Content-Transfer-Encoding: base64");
      body = b64(mail.text);
    }
    await cmd(sock, r, headers.join("\r\n") + "\r\n\r\n" + body + "\r\n.", [250]);
    sock.write("QUIT\r\n");
  } finally {
    sock.end();
  }
}
