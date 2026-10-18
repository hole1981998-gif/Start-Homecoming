import { movingScenarios } from './moving-scenarios';

const host = document.getElementById('cases');
if (host) for (const [scenario, title, description] of movingScenarios) {
  const card = document.createElement('article'), heading = document.createElement('h2');
  const text = document.createElement('p'), link = document.createElement('a');
  heading.textContent = title; text.textContent = description;
  link.href = '/?scenario=' + scenario + '&seed=17'; link.textContent = 'Chơi thử';
  link.setAttribute('aria-label', 'Chơi thử: ' + title);
  card.append(heading, text, link); host.append(card);
}
