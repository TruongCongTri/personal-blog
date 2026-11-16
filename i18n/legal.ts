import type { Locale } from "@/i18n/config";

/**
 * The policy documents (/legal/privacy, /legal/cookies, /legal/terms).
 *
 * Written for what this site actually does: no accounts, forms, analytics or
 * ads; a language cookie and a consent cookie; soundtrack position in
 * localStorage (with consent); YouTube trailers and stills (with consent);
 * hosting + Cloudflare R2 for delivery. If that changes, change these.
 *
 * Placeholders: {contact} (NEXT_PUBLIC_CONTACT_EMAIL), {host}
 * (NEXT_PUBLIC_HOSTING_PROVIDER), {site} (the site's address).
 *
 * Not legal advice: have them reviewed before relying on them.
 */

export const LEGAL_DOCS = ["privacy", "cookies", "terms"] as const;
export type LegalDocId = (typeof LEGAL_DOCS)[number];

export type LegalBlock =
  | string
  | { list: string[] }
  | { table: { head: string[]; rows: string[][] } }
  /** The songs that play on the site, listed from lib/discography.ts. */
  | { music: true }
  /** Credits for the object photos, listed from the reviews. */
  | { credits: true };
export type LegalDoc = {
  title: string;
  description: string;
  sections: { h: string; body: LegalBlock[] }[];
};

/** Date of the current version of all three documents. */
export const LEGAL_UPDATED = "2026-11-15";

const en: Record<LegalDocId, LegalDoc> = {
  privacy: {
    title: "Privacy Policy",
    description:
      "How Film Files handles personal data, under Vietnam’s Law on Personal Data Protection and the EU/UK GDPR.",
    sections: [
      {
        h: "Who is responsible",
        body: [
          "Film Files ({site}) is a personal, non-commercial blog of film essays, run by its author as an individual. The author decides how the personal data described here is processed, and is its controller (the “personal data controller” under Vietnam’s Law on Personal Data Protection).",
          "Contact for anything about privacy: {contact}.",
        ],
      },
      {
        h: "The short version",
        body: [
          {
            list: [
              "No accounts, sign-up forms, comments, analytics, advertising or tracking.",
              "Nothing optional is stored on your device, and nothing is loaded from YouTube, until you agree in the cookie banner.",
              "You can change your choices at any time with “Cookie settings” at the foot of the drawer or on these pages.",
              "Your personal data is never sold, and never shared for advertising.",
            ],
          },
        ],
      },
      {
        h: "What is processed, and why",
        body: [
          {
            table: {
              head: ["Data", "Purpose", "Legal basis", "Kept for"],
              rows: [
                [
                  "Technical request data: IP address, browser type, page requested, time",
                  "Deliver the pages, images and music; keep the site secure",
                  "Needed to provide the service you ask for; legitimate interest in security (GDPR Art. 6(1)(f))",
                  "Short-lived server logs, as kept by {host} and Cloudflare",
                ],
                [
                  "Language cookie (NEXT_LOCALE)",
                  "Open the site in the language you chose",
                  "Strictly necessary for a feature you asked for",
                  "1 year",
                ],
                [
                  "Consent cookie (ff_consent): your choices and when you made them",
                  "Respect your choices, and be able to show that consent was given",
                  "Legal obligation; strictly necessary",
                  "12 months",
                ],
                [
                  "Soundtrack position and play/pause choice, stored on your device",
                  "Resume each film’s music where it stopped",
                  "Your consent (Preferences)",
                  "Until you withdraw consent or clear your browser data",
                ],
                [
                  "IP address and device information sent to YouTube (Google) when trailers or stills load",
                  "Show trailers and trailer stills",
                  "Your consent (YouTube media)",
                  "As set out in Google’s privacy policy",
                ],
              ],
            },
          },
          "Consent is asked for before anything optional happens, is never assumed from silence or pre-ticked boxes, and can be withdrawn as easily as it was given, as required by Vietnam’s Law on Personal Data Protection (Law No. 91/2025/QH15) and Decree No. 356/2025/ND-CP, and by the GDPR.",
        ],
      },
      {
        h: "Who receives data",
        body: [
          {
            list: [
              "{host}, which hosts the website.",
              "Cloudflare, Inc., which stores and delivers the site’s images and music (Cloudflare R2).",
              "Google LLC (YouTube), only if you allow YouTube media.",
              "Competent authorities, only where Vietnamese law or another applicable law requires it.",
            ],
          },
        ],
      },
      {
        h: "Transfers outside Vietnam",
        body: [
          "These providers may process data on servers outside Vietnam, including in the United States and the European Union, under their own safeguards (such as the EU Standard Contractual Clauses). Data goes to them only as far as needed to deliver the site, or, for YouTube, with your consent.",
        ],
      },
      {
        h: "Your rights",
        body: [
          "Under Vietnam’s Law on Personal Data Protection and Decree No. 356/2025/ND-CP, you have the right to be informed, to give and withdraw consent, to access, correct and delete your personal data, to restrict or object to its processing, and to complain, denounce or take legal action.",
          "If the EU or UK GDPR applies to you, you also have the rights of access, rectification, erasure, restriction, data portability and objection, and you may lodge a complaint with your data protection authority.",
          "Under California’s privacy law (CCPA/CPRA), you have the rights to know, delete and correct, and to opt out of the sale or sharing of personal information. This site neither sells nor shares it.",
          "The site keeps almost nothing about you, so most requests are met by changing your choices in Cookie settings or clearing your browser data. For anything else, write to {contact}. You will get an answer without undue delay, within the time limits of the applicable law.",
        ],
      },
      {
        h: "Withdrawing consent",
        body: [
          "Open Cookie settings and switch a category off. Data stored on your device for that purpose is erased at once. Withdrawing does not affect what was done before.",
        ],
      },
      {
        h: "Children",
        body: [
          "The site is not directed at children and does not knowingly process children’s personal data. Where the law requires it, a parent or guardian’s consent is needed for a child’s data.",
        ],
      },
      {
        h: "Security",
        body: [
          "The site is served only over HTTPS. It keeps no database of visitors, and it limits outside connections to the providers listed above.",
        ],
      },
      {
        h: "Changes",
        body: [
          "When this policy changes, the date at the top changes. If a change affects what you agreed to, the cookie banner asks you again.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie Policy",
    description: "The cookies and similar storage Film Files uses, and how to control them.",
    sections: [
      {
        h: "What this covers",
        body: [
          "Cookies, and similar storage on your device such as localStorage, used by Film Files. Under the EU ePrivacy Directive (Art. 5(3)), the UK PECR and Vietnam’s Law on Personal Data Protection, anything that isn’t strictly necessary is used only with your prior consent.",
        ],
      },
      {
        h: "Strictly necessary (always on)",
        body: [
          {
            table: {
              head: ["Name", "Type", "Purpose", "Duration", "Set by"],
              rows: [
                ["NEXT_LOCALE", "Cookie", "Remembers the language you chose", "1 year", "This site"],
                ["ff_consent", "Cookie", "Stores your cookie and sound choices, and when you made them", "12 months", "This site"],
              ],
            },
          },
        ],
      },
      {
        h: "Preferences (with your consent)",
        body: [
          {
            table: {
              head: ["Name", "Type", "Purpose", "Duration", "Set by"],
              rows: [
                [
                  "ff-audio",
                  "localStorage",
                  "Where each soundtrack stopped, and whether you paused the music",
                  "Until you withdraw consent or clear site data",
                  "This site",
                ],
              ],
            },
          },
        ],
      },
      {
        h: "YouTube media (with your consent)",
        body: [
          "Trailers play in YouTube’s privacy-enhanced mode (youtube-nocookie.com), and trailer stills load from i.ytimg.com. If you allow this, your browser connects to Google, which receives your IP address and may store cookies or similar data on your device, especially once a video plays. Google sets and controls these. See Google’s Privacy Policy (policies.google.com/privacy) and how Google uses cookies (policies.google.com/technologies/cookies).",
          "Without this consent, nothing is loaded from Google: the film’s own poster stands in for the stills, and each trailer asks before it loads.",
        ],
      },
      {
        h: "Sound settings",
        body: [
          "These are not cookies, but they are asked in the same place: whether a folder’s music may start by itself after your first tap, and whether it may keep playing in the background. Your answers are kept in the consent cookie.",
        ],
      },
      {
        h: "No analytics, no advertising",
        body: ["Film Files uses no analytics, advertising or social-media tracking cookies."],
      },
      {
        h: "Changing your choices",
        body: [
          "Use Cookie settings at any time, or delete cookies and site data in your browser settings. Your choices expire after 12 months, and you will then be asked again.",
        ],
      },
    ],
  },

  terms: {
    title: "Terms of Use",
    description: "The terms for reading Film Files.",
    sections: [
      {
        h: "About Film Files",
        body: [
          "Film Files is a personal, non-commercial blog of essays about films. Each essay tests one saying against one film. They are opinions, not statements of fact or professional advice. By using the site you accept these terms.",
        ],
      },
      {
        h: "The essays",
        body: [
          "The essays, design and code are © 2026 the author. You may quote short passages with a credit and a link. Anything more needs permission.",
        ],
      },
      {
        h: "Films, images and trailers",
        body: [
          "Film titles, posters, stills and trailers belong to their respective rights holders and appear here for criticism, commentary and review. Trailers are embedded from YouTube under YouTube’s terms.",
          "If you hold rights in any of this material and want it credited differently or removed, write to {contact}. Requests are dealt with promptly.",
        ],
      },
      {
        h: "Photographs of objects",
        body: [
          "The objects lying on each folder are real photographs, cut out from their backgrounds. They are shared by their authors under the licences below; the cut-out versions are shared under the same licence.",
          { credits: true },
        ],
      },
      {
        h: "Music",
        body: [
          "The songs that play on this site are copyrighted works. All rights belong to their composers, performers, record labels and publishers. Film Files does not hold the rights to them, claims no ownership, and earns nothing from them: the site has no ads, sales or paid access.",
          "A film’s song plays only in that film’s folder, as part of the commentary on it; one theme plays on the home and About pages. Songs are streamed, never offered for download.",
          "Songs currently on the site:",
          { music: true },
          "If you hold rights in any of these songs and want it removed, write to {contact} and name the song. It will be taken off the site promptly, without dispute. The same applies to any other material on the site.",
        ],
      },
      {
        h: "Third-party services",
        body: [
          "Trailers are provided by YouTube. When you play one, YouTube’s Terms of Service and Google’s Privacy Policy apply.",
        ],
      },
      {
        h: "Acceptable use",
        body: [
          "Don’t attack, overload, probe or disrupt the site or its providers, scrape it at scale, or use it for anything unlawful. The acts prohibited by Vietnam’s Law on Cybersecurity (Law No. 116/2025/QH15), and by similar laws elsewhere, are not allowed.",
        ],
      },
      {
        h: "Content and the law",
        body: [
          "The site publishes film criticism only, written to comply with Vietnamese law, including the Law on Cybersecurity, and with the law of the places where it is read. If you believe something here is unlawful, write to {contact}.",
        ],
      },
      {
        h: "No warranty",
        body: [
          "The site is provided as it is, without warranties. As far as the law allows, the author is not liable for losses arising from its use. Nothing here limits consumer rights that cannot be excluded by agreement.",
        ],
      },
      {
        h: "Governing law",
        body: [
          "These terms are governed by the law of Vietnam. If you use the site as a consumer in another country, you keep the protection of that country’s mandatory laws.",
        ],
      },
      {
        h: "Changes",
        body: ["These terms may be updated. The date at the top shows the current version."],
      },
    ],
  },
};

const vi: Record<LegalDocId, LegalDoc> = {
  privacy: {
    title: "Chính sách quyền riêng tư",
    description:
      "Cách Hồ Sơ Phim xử lý dữ liệu cá nhân, theo Luật Bảo vệ dữ liệu cá nhân của Việt Nam và GDPR của EU/Vương quốc Anh.",
    sections: [
      {
        h: "Ai chịu trách nhiệm",
        body: [
          "Hồ Sơ Phim ({site}) là blog cá nhân, phi thương mại, gồm các bài viết về phim, do tác giả vận hành với tư cách cá nhân. Tác giả quyết định việc xử lý dữ liệu cá nhân được mô tả tại đây và là “bên kiểm soát dữ liệu cá nhân” theo Luật Bảo vệ dữ liệu cá nhân.",
          "Liên hệ về quyền riêng tư: {contact}.",
        ],
      },
      {
        h: "Tóm tắt",
        body: [
          {
            list: [
              "Không có tài khoản, biểu mẫu đăng ký, bình luận, công cụ phân tích, quảng cáo hay theo dõi.",
              "Trang không lưu gì không bắt buộc trên thiết bị của bạn, và không tải gì từ YouTube, cho đến khi bạn đồng ý trong hộp thông báo cookie.",
              "Bạn có thể thay đổi lựa chọn bất cứ lúc nào qua “Cài đặt cookie” ở cuối ngăn tủ hoặc trên các trang này.",
              "Dữ liệu cá nhân của bạn không bao giờ bị bán hay chia sẻ cho mục đích quảng cáo.",
            ],
          },
        ],
      },
      {
        h: "Dữ liệu được xử lý và mục đích",
        body: [
          {
            table: {
              head: ["Dữ liệu", "Mục đích", "Cơ sở pháp lý", "Thời gian lưu"],
              rows: [
                [
                  "Dữ liệu kỹ thuật của yêu cầu: địa chỉ IP, loại trình duyệt, trang được yêu cầu, thời điểm",
                  "Cung cấp trang, hình ảnh và nhạc; bảo đảm an toàn cho trang",
                  "Cần thiết để cung cấp dịch vụ bạn yêu cầu; lợi ích chính đáng về an ninh (Điều 6(1)(f) GDPR)",
                  "Nhật ký máy chủ ngắn hạn, do {host} và Cloudflare lưu giữ",
                ],
                ["Cookie ngôn ngữ (NEXT_LOCALE)", "Mở trang bằng ngôn ngữ bạn đã chọn", "Thiết yếu cho một tính năng bạn yêu cầu", "1 năm"],
                [
                  "Cookie đồng ý (ff_consent): các lựa chọn của bạn và thời điểm lựa chọn",
                  "Tôn trọng lựa chọn của bạn và chứng minh được việc bạn đã đồng ý",
                  "Nghĩa vụ pháp lý; thiết yếu",
                  "12 tháng",
                ],
                [
                  "Vị trí đang phát của nhạc phim và lựa chọn phát/tạm dừng, lưu trên thiết bị của bạn",
                  "Tiếp tục nhạc của từng phim từ chỗ đã dừng",
                  "Sự đồng ý của bạn (Tùy chọn cá nhân)",
                  "Đến khi bạn rút lại sự đồng ý hoặc xóa dữ liệu trình duyệt",
                ],
                [
                  "Địa chỉ IP và thông tin thiết bị gửi tới YouTube (Google) khi tải trailer hoặc hình ảnh",
                  "Hiển thị trailer và hình ảnh trailer",
                  "Sự đồng ý của bạn (Nội dung YouTube)",
                  "Theo chính sách quyền riêng tư của Google",
                ],
              ],
            },
          },
          "Sự đồng ý được hỏi trước khi bất cứ việc gì không bắt buộc diễn ra. Im lặng hay ô đánh dấu sẵn không bao giờ được coi là đồng ý, và bạn có thể rút lại sự đồng ý dễ dàng như khi đưa ra, theo Luật Bảo vệ dữ liệu cá nhân (Luật số 91/2025/QH15), Nghị định số 356/2025/NĐ-CP và GDPR.",
        ],
      },
      {
        h: "Ai nhận dữ liệu",
        body: [
          {
            list: [
              "{host}, đơn vị lưu trữ trang web.",
              "Cloudflare, Inc., đơn vị lưu trữ và phân phối hình ảnh và nhạc của trang (Cloudflare R2).",
              "Google LLC (YouTube), chỉ khi bạn cho phép nội dung YouTube.",
              "Cơ quan có thẩm quyền, chỉ khi pháp luật Việt Nam hoặc pháp luật áp dụng khác yêu cầu.",
            ],
          },
        ],
      },
      {
        h: "Chuyển dữ liệu ra nước ngoài",
        body: [
          "Các đơn vị trên có thể xử lý dữ liệu trên máy chủ ngoài Việt Nam, bao gồm tại Hoa Kỳ và Liên minh châu Âu, với các biện pháp bảo vệ của riêng họ (như Điều khoản hợp đồng tiêu chuẩn của EU). Dữ liệu chỉ được chuyển ở mức cần thiết để cung cấp trang, hoặc tới YouTube khi có sự đồng ý của bạn.",
        ],
      },
      {
        h: "Quyền của bạn",
        body: [
          "Theo Luật Bảo vệ dữ liệu cá nhân và Nghị định số 356/2025/NĐ-CP, bạn có quyền được biết, đồng ý và rút lại sự đồng ý, truy cập, chỉnh sửa và xóa dữ liệu cá nhân, hạn chế hoặc phản đối việc xử lý, và khiếu nại, tố cáo, khởi kiện.",
          "Nếu GDPR của EU hoặc Vương quốc Anh áp dụng với bạn, bạn còn có quyền truy cập, chỉnh sửa, xóa, hạn chế xử lý, di chuyển dữ liệu và phản đối, cũng như quyền khiếu nại với cơ quan bảo vệ dữ liệu.",
          "Theo luật quyền riêng tư của California (CCPA/CPRA), bạn có quyền được biết, xóa, chỉnh sửa và từ chối việc bán hoặc chia sẻ thông tin cá nhân. Trang này không bán và không chia sẻ thông tin đó.",
          "Trang hầu như không lưu gì về bạn, nên phần lớn yêu cầu có thể thực hiện bằng cách đổi lựa chọn trong Cài đặt cookie hoặc xóa dữ liệu trình duyệt. Với các yêu cầu khác, hãy viết tới {contact}. Bạn sẽ nhận được phản hồi không chậm trễ, trong thời hạn pháp luật áp dụng quy định.",
        ],
      },
      {
        h: "Rút lại sự đồng ý",
        body: [
          "Mở Cài đặt cookie và tắt một mục. Dữ liệu lưu trên thiết bị cho mục đích đó sẽ bị xóa ngay. Việc rút lại không ảnh hưởng tới những gì đã thực hiện trước đó.",
        ],
      },
      {
        h: "Trẻ em",
        body: [
          "Trang không hướng tới trẻ em và không cố ý xử lý dữ liệu cá nhân của trẻ em. Khi pháp luật yêu cầu, việc xử lý dữ liệu của trẻ em cần có sự đồng ý của cha, mẹ hoặc người giám hộ.",
        ],
      },
      {
        h: "An toàn",
        body: [
          "Trang chỉ được phục vụ qua HTTPS, không có cơ sở dữ liệu về người truy cập, và chỉ kết nối ra ngoài tới các đơn vị nêu trên.",
        ],
      },
      {
        h: "Thay đổi",
        body: [
          "Khi chính sách này thay đổi, ngày ở đầu trang sẽ thay đổi. Nếu thay đổi ảnh hưởng tới những gì bạn đã đồng ý, hộp thông báo cookie sẽ hỏi lại bạn.",
        ],
      },
    ],
  },

  cookies: {
    title: "Chính sách cookie",
    description: "Các cookie và hình thức lưu trữ tương tự mà Hồ Sơ Phim sử dụng, và cách kiểm soát chúng.",
    sections: [
      {
        h: "Phạm vi",
        body: [
          "Cookie và các hình thức lưu trữ tương tự trên thiết bị của bạn, như localStorage, mà Hồ Sơ Phim sử dụng. Theo Chỉ thị ePrivacy của EU (Điều 5(3)), PECR của Vương quốc Anh và Luật Bảo vệ dữ liệu cá nhân của Việt Nam, những gì không thiết yếu chỉ được dùng khi bạn đã đồng ý trước.",
        ],
      },
      {
        h: "Thiết yếu (luôn bật)",
        body: [
          {
            table: {
              head: ["Tên", "Loại", "Mục đích", "Thời hạn", "Bên đặt"],
              rows: [
                ["NEXT_LOCALE", "Cookie", "Ghi nhớ ngôn ngữ bạn đã chọn", "1 năm", "Trang này"],
                ["ff_consent", "Cookie", "Lưu lựa chọn về cookie và âm thanh của bạn, cùng thời điểm lựa chọn", "12 tháng", "Trang này"],
              ],
            },
          },
        ],
      },
      {
        h: "Tùy chọn cá nhân (khi bạn đồng ý)",
        body: [
          {
            table: {
              head: ["Tên", "Loại", "Mục đích", "Thời hạn", "Bên đặt"],
              rows: [
                [
                  "ff-audio",
                  "localStorage",
                  "Vị trí đang phát của từng bản nhạc phim, và việc bạn có tạm dừng nhạc hay không",
                  "Đến khi bạn rút lại sự đồng ý hoặc xóa dữ liệu trang",
                  "Trang này",
                ],
              ],
            },
          },
        ],
      },
      {
        h: "Nội dung YouTube (khi bạn đồng ý)",
        body: [
          "Trailer được phát ở chế độ bảo mật nâng cao của YouTube (youtube-nocookie.com), và hình ảnh trailer được tải từ i.ytimg.com. Nếu bạn cho phép, trình duyệt sẽ kết nối với Google. Google nhận địa chỉ IP của bạn và có thể lưu cookie hoặc dữ liệu tương tự trên thiết bị của bạn, nhất là khi video bắt đầu phát. Các cookie này do Google đặt và kiểm soát. Xem Chính sách quyền riêng tư của Google (policies.google.com/privacy) và cách Google sử dụng cookie (policies.google.com/technologies/cookies).",
          "Nếu bạn không đồng ý, trang không tải gì từ Google: áp phích của phim được dùng thay cho hình ảnh trailer, và mỗi trailer sẽ hỏi trước khi tải.",
        ],
      },
      {
        h: "Cài đặt âm thanh",
        body: [
          "Đây không phải cookie, nhưng được hỏi cùng chỗ: nhạc của một hồ sơ có được tự phát sau lần chạm đầu tiên không, và có được tiếp tục phát khi chạy nền không. Câu trả lời của bạn được lưu trong cookie đồng ý.",
        ],
      },
      {
        h: "Không phân tích, không quảng cáo",
        body: ["Hồ Sơ Phim không dùng cookie phân tích, quảng cáo hay theo dõi của mạng xã hội."],
      },
      {
        h: "Thay đổi lựa chọn",
        body: [
          "Dùng Cài đặt cookie bất cứ lúc nào, hoặc xóa cookie và dữ liệu trang trong cài đặt trình duyệt. Lựa chọn của bạn hết hạn sau 12 tháng, và khi đó bạn sẽ được hỏi lại.",
        ],
      },
    ],
  },

  terms: {
    title: "Điều khoản sử dụng",
    description: "Điều khoản khi đọc Hồ Sơ Phim.",
    sections: [
      {
        h: "Về Hồ Sơ Phim",
        body: [
          "Hồ Sơ Phim là blog cá nhân, phi thương mại, gồm các bài viết về phim. Mỗi bài thử một câu nói với một bộ phim. Đó là ý kiến cá nhân, không phải khẳng định sự thật hay tư vấn chuyên môn. Khi sử dụng trang, bạn chấp nhận các điều khoản này.",
        ],
      },
      {
        h: "Các bài viết",
        body: [
          "Bài viết, thiết kế và mã nguồn thuộc quyền tác giả © 2026. Bạn có thể trích dẫn đoạn ngắn kèm ghi nguồn và đường dẫn. Mọi hình thức sử dụng khác cần được cho phép.",
        ],
      },
      {
        h: "Phim, hình ảnh và trailer",
        body: [
          "Tên phim, áp phích, hình ảnh và trailer thuộc về chủ sở hữu quyền tương ứng, và xuất hiện tại đây cho mục đích phê bình, bình luận và giới thiệu. Trailer được nhúng từ YouTube theo điều khoản của YouTube.",
          "Nếu bạn là chủ sở hữu quyền đối với bất kỳ nội dung nào trong số này và muốn được ghi nhận khác đi hoặc gỡ bỏ, hãy viết tới {contact}. Yêu cầu sẽ được xử lý nhanh chóng.",
        ],
      },
      {
        h: "Ảnh chụp đồ vật",
        body: [
          "Các đồ vật đặt trên mỗi hồ sơ là ảnh chụp thật, đã được tách khỏi nền. Chúng được tác giả chia sẻ theo các giấy phép dưới đây; bản đã tách nền được chia sẻ theo cùng giấy phép.",
          { credits: true },
        ],
      },
      {
        h: "Âm nhạc",
        body: [
          "Các bài hát phát trên trang này là tác phẩm được bảo hộ quyền tác giả. Mọi quyền thuộc về nhà soạn nhạc, người biểu diễn, hãng thu âm và nhà phát hành. Hồ Sơ Phim không nắm giữ quyền đối với các bài hát này, không nhận quyền sở hữu, và không thu lợi gì từ chúng: trang không có quảng cáo, không bán hàng và không thu phí truy cập.",
          "Bài hát của một bộ phim chỉ phát trong hồ sơ của phim đó, như một phần của bài bình luận về phim; một bản nhạc chủ đề phát trên trang chủ và trang Giới thiệu. Bài hát chỉ được phát trực tuyến, không bao giờ được cung cấp để tải xuống.",
          "Các bài hát hiện có trên trang:",
          { music: true },
          "Nếu bạn là chủ sở hữu quyền đối với bất kỳ bài hát nào trong số này và muốn gỡ bỏ, hãy viết tới {contact} và nêu tên bài hát. Bài hát sẽ được gỡ khỏi trang nhanh chóng, không tranh cãi. Điều này cũng áp dụng cho mọi nội dung khác trên trang.",
        ],
      },
      {
        h: "Dịch vụ của bên thứ ba",
        body: [
          "Trailer do YouTube cung cấp. Khi bạn phát trailer, Điều khoản dịch vụ của YouTube và Chính sách quyền riêng tư của Google được áp dụng.",
        ],
      },
      {
        h: "Sử dụng hợp lệ",
        body: [
          "Không tấn công, gây quá tải, dò quét hoặc làm gián đoạn trang hay các đơn vị cung cấp dịch vụ cho trang, không thu thập dữ liệu hàng loạt, và không sử dụng trang cho bất kỳ mục đích trái pháp luật nào. Các hành vi bị nghiêm cấm theo Luật An ninh mạng (Luật số 116/2025/QH15) và các luật tương tự ở nơi khác đều không được phép.",
        ],
      },
      {
        h: "Nội dung và pháp luật",
        body: [
          "Trang chỉ đăng bài phê bình phim, được viết để tuân thủ pháp luật Việt Nam, bao gồm Luật An ninh mạng, và pháp luật nơi trang được đọc. Nếu bạn cho rằng nội dung nào đó trái pháp luật, hãy viết tới {contact}.",
        ],
      },
      {
        h: "Không bảo đảm",
        body: [
          "Trang được cung cấp theo hiện trạng, không kèm bảo đảm. Trong phạm vi pháp luật cho phép, tác giả không chịu trách nhiệm về tổn thất phát sinh từ việc sử dụng trang. Không điều khoản nào ở đây hạn chế các quyền của người tiêu dùng mà không thể loại trừ bằng thỏa thuận.",
        ],
      },
      {
        h: "Luật áp dụng",
        body: [
          "Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Nếu bạn sử dụng trang với tư cách người tiêu dùng ở quốc gia khác, bạn vẫn được bảo vệ bởi các quy định bắt buộc của quốc gia đó.",
        ],
      },
      {
        h: "Thay đổi",
        body: ["Các điều khoản này có thể được cập nhật. Ngày ở đầu trang cho biết phiên bản hiện hành."],
      },
    ],
  },
};

export const LEGAL: Record<Locale, Record<LegalDocId, LegalDoc>> = { en, vi };
