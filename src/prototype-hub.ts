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

import { forceScenarios } from './force-scenarios';
const forceHost=document.getElementById('forces');
if(forceHost) for(const [scenario,title] of forceScenarios){const link=document.createElement('a');link.href='/?scenario='+scenario+'&seed=17';link.textContent=title;link.style.display='block';forceHost.append(link);}
