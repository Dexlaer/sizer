# Размер кадра

Статический сайт для GitHub Pages: быстрый расчет пропорций, ориентации и мегапикселей по ширине и высоте.

Сайт подключен как PWA: на телефоне его можно добавить на главный экран через меню браузера.

Кнопка поддержки ведет на платежную страницу All-Bot.ru:

```text
https://all-bot.ru/pay/sizer
```

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
