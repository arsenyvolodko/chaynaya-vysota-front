import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { IconChevronLeft } from "../components/icons.jsx";

function ContactBlock({ label, children }) {
  return (
    <section className="contact-block">
      <div className="contact-block__label">{label}</div>
      <div className="contact-block__body">{children}</div>
    </section>
  );
}

function ExternalLink({ href, children }) {
  return (
    <a
      className="contact-block__link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

function PhoneLink({ tel, label }) {
  return (
    <a className="contact-block__phone tabnum" href={`tel:${tel.replace(/\D/g, "")}`}>
      {label || tel}
    </a>
  );
}

export default function ContactsPage() {
  const navigate = useNavigate();
  return (
    <div className="contacts-scroll">
      <PageHeader
        back={
          <button className="icon-btn icon-btn--leading" onClick={() => navigate(-1)}>
            <IconChevronLeft size={20} />
            <span>Назад</span>
          </button>
        }
      />
      <div className="contacts-body">
        <h1 className="title-lg" style={{ marginBottom: 6 }}>Контакты</h1>
        <p className="contacts-lede">Клуб «Чайная высота. Дом чая и&nbsp;мороженого»</p>

        <ContactBlock label="Сайт клуба — события и блог">
          <ExternalLink href="https://cha108.ru">cha108.ru</ExternalLink>
        </ContactBlock>

        <ContactBlock label="Магазин билетов, событий и порций">
          <ExternalLink href="https://teatix.com/shop">teatix.com/shop</ExternalLink>
        </ContactBlock>

        <ContactBlock label="Купить чайную воду">
          <ExternalLink href="https://teatix.com/voda">teatix.com/voda</ExternalLink>
        </ContactBlock>

        <ContactBlock label="Адреса чайных">
          <ExternalLink href="https://cha108.ru/?page_id=6795">
            cha108.ru/?page_id=6795
          </ExternalLink>
        </ContactBlock>

        <ContactBlock label="ЧайФоны">
          <div className="contact-block__group">
            <div className="contact-block__sub">Чайная высота на Покровке</div>
            <PhoneLink tel="8(800)100-7-108" />
            <PhoneLink tel="8(495)22-55-99-6" />
          </div>
          <div className="contact-block__group">
            <div className="contact-block__sub">Чайная высота на Тверской</div>
            <PhoneLink tel="8(963)77-00-55-3" />
          </div>
        </ContactBlock>
      </div>
    </div>
  );
}
