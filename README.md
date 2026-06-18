# Sizer

Статический сайт для GitHub Pages: визуализатор пропорций кадра по ширине и высоте.

## Публикация в `Dexlaer/sizer`

```bash
git init
git branch -M main
git remote add origin https://github.com/Dexlaer/sizer.git
git add .
git commit -m "Add Sizer static site"
git push -u origin main
```

После пуша откройте `Settings -> Pages` в репозитории и выберите один из вариантов:

- `Build and deployment -> Source: GitHub Actions`, если хотите использовать готовый workflow.
- `Deploy from a branch -> main / root`, если хотите публиковать прямо из файлов в корне.

Сайт будет доступен по адресу:

```text
https://dexlaer.github.io/sizer/
```
