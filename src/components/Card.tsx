import type { ReactNode } from "react";

export default function Card(props: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="card">
      {(props.title || props.right) && (
        <div className="card__header">
          {props.title ? <h2 className="card__title">{props.title}</h2> : <div />}
          {props.right ? <div className="card__right">{props.right}</div> : null}
        </div>
      )}
      <div className="card__body">{props.children}</div>
    </section>
  );
}
