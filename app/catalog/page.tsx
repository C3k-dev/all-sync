"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./styles.module.scss";

// Тип фильма
interface Movie {
  id: string;
  title: string;
  year: number;
  genre: string;
  rating: number;
  poster: string;
}

// Пример списка фильмов (потом можно заменить API)
const movies: Movie[] = [
  { id: "1", title: "Интерстеллар", year: 2014, genre: "Фантастика", rating: 8.6, poster: "/posters/interstellar.jpg" },
  { id: "2", title: "Темный рыцарь", year: 2008, genre: "Боевик", rating: 9.0, poster: "/posters/darkknight.jpg" },
  { id: "3", title: "Начало", year: 2010, genre: "Фантастика", rating: 8.7, poster: "/posters/inception.jpg" },
];

export default function CatalogPage() {
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"rating" | "year">("rating");

  const filtered = movies
    .filter((m) => (genre ? m.genre === genre : true))
    .filter((m) => (year ? m.year === year : true))
    .sort((a, b) => (sortBy === "rating" ? b.rating - a.rating : b.year - a.year));

  return (
    <main className={styles.catalog}>
      <h1>Каталог фильмов и сериалов</h1>

      <div className={styles.filters}>
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">Все жанры</option>
          <option value="Фантастика">Фантастика</option>
          <option value="Боевик">Боевик</option>
        </select>

        <select value={year || ""} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Все годы</option>
          <option value="2014">2014</option>
          <option value="2010">2010</option>
          <option value="2008">2008</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="rating">По рейтингу</option>
          <option value="year">По году</option>
        </select>
      </div>

      <div className={styles.list}>
        {filtered.map((m) => (
          <Link key={m.id} href={`/catalog/${m.id}`} className={styles.card}>
            <img src={m.poster} alt={m.title} />
            <h3>{m.title}</h3>
            <p>{m.year} • {m.genre}</p>
            <p>⭐ {m.rating}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
