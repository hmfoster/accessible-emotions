let emotionData = {};
let partSensations = {};
let sensationEmotions = {};
let currentEmotionIndex = 0;
const selections = {
  sensations: [],
  emotions: [],
  nuanced: {},
  needs: {},
};
/* IDEAS
      - Make text in selected items change-- stray clicks might not obvious to someone with low vision
      - Dropdown to navigate between emotions?
      - Input to enter text for "something else"?
    */
/* NEXT
   See chatgpt for how to make nav better for screen reader
   */
const step1 = document.getElementById('step1');
const sensationsContainer = document.getElementById('sensationsContainer');
const skipSensationsBtn = document.getElementById('skipSensationsBtn');
const step1Btn = document.getElementById('step1Btn');

const step2 = document.getElementById('step2');
const emotionContainer = document.getElementById('emotionContainer');
const nextEmotionBtn = document.getElementById('nextEmotionBtn');
const prevEmotionBtn = document.getElementById('prevEmotionBtn');

const step3 = document.getElementById('step3');
const summaryContainer = document.getElementById('summaryContainer');
const step3BackBtn = document.getElementById('step3BackBtn');
const copySummaryBtn = document.getElementById('copyBtn');

async function loadDataset() {
  const response = await fetch('emotionData.json');
  emotionData = await response.json();

  let sensations, sensation;
  for (const emotion in emotionData) {
    sensations = emotionData[emotion].sensations;
    for (const bodyPart in sensations) {
      if (partSensations[bodyPart] === undefined) {
        partSensations[bodyPart] = [];
      }
      sensations[bodyPart].forEach((sensation) => {
        partSensations[bodyPart].push(sensation);
        sensationEmotions[sensation] = emotion;
      });
    }
    emotionData[emotion].sensations = Object.values(sensations).flat();
  }
  renderSensations();
}

function appendHTML(container, type, innerhtml) {
  const element = document.createElement(type);
  element.innerHTML = innerhtml || '';
  container.appendChild(element);
  return element;
}

function createCheckbox(value, container, addBreak) {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.value = value;

  const label = document.createElement('label');
  label.appendChild(input);
  label.appendChild(document.createTextNode(' ' + value));

  container.appendChild(label);
  if (addBreak) container.appendChild(document.createElement('br'));

  return input;
}

function renderSensations() {
  for (part in partSensations) {
    appendHTML(sensationsContainer,'br');
    appendHTML(sensationsContainer, 'h3',`${part.charAt(0).toUpperCase() + part.slice(1)}`);

    const groupDiv = appendHTML(sensationsContainer,'div');
    groupDiv.className = 'checkbox-group';
    groupDiv.setAttribute(
      'aria-label',
      `Select all the sensations in your ${part} you are aware of.`
    );

    partSensations[part].forEach((sensation) => {
      createCheckbox(sensation, groupDiv);
    });
  }

};

skipSensationsBtn.addEventListener("click", () => {
  selections.emotions = Object.keys(emotionData);
  step1.classList.add("hidden");
  step2.classList.remove("hidden");
  nextEmotionBtn.classList.remove("hidden");
  renderEmotion();
});

step1Btn.addEventListener("click", () => {
  const checked = Array.from(
    document.querySelectorAll('#step1 input[type="checkbox"]:checked')
  );

  selections.sensations = checked.map((cb) => cb.value);
  let matchedEmotions = new Set(
    selections.sensations.map((sensation) => sensationEmotions[sensation])
  );

  step1.classList.add("hidden");
  step2.classList.remove("hidden");
  if (matchedEmotions.size === 0) {
    nextEmotionBtn.classList.add("hidden");
    emotionContainer.innerHTML =
      `<h2>You did not select any sensations.</h2>
      <p>Go back to select body sensations or explore all emotions.</p>`;
    return;
  }
  nextEmotionBtn.classList.remove("hidden");
  selections.emotions = [...matchedEmotions];
  renderEmotion();
});

function renderEmotion() {
  emotionContainer.innerHTML = "";

  const emotion = selections.emotions[currentEmotionIndex];
  const currentEmotionData = emotionData[emotion];
  if (selections.nuanced[emotion] === undefined) selections.nuanced[emotion] = [];
  if (selections.needs[emotion] === undefined) selections.needs[emotion] = [];

  appendHTML(emotionContainer,'br');
  const h2 = appendHTML(emotionContainer,'h2', emotion);

  let sensationText;
  if (selections.sensations.length > 0) {
    const sensedLabels = [...selections.sensations].filter(
      (sensation) => sensationEmotions[sensation] === emotion
    );

    sensationText = `You noticed <b>${sensedLabels.join(", ")}</b>.`;

    const sensationValuesSet = new Set(selections.sensations);
    const excludedLabels = currentEmotionData.sensations.filter(
      (sensation) => !sensationValuesSet.has(sensation)
    );

    sensationText += ` Other sensations of ${emotion.charAt(0).toLowerCase() + emotion.slice(1)} can include ${excludedLabels.join(", ")}.`

  } else {
    sensationText = `Sensations of ${emotion.charAt(0).toLowerCase() +
      emotion.slice(1)} can include ${currentEmotionData.sensations.join(", ")}.`
  }
  appendHTML(emotionContainer,'p',sensationText);
  appendHTML(emotionContainer,'h3','More specifically, I feel... [optional]');

  const nuancedEmotionsGroupDiv = appendHTML(emotionContainer,'div');
  nuancedEmotionsGroupDiv.className = "checkbox-group";
  nuancedEmotionsGroupDiv.setAttribute(
    "aria-label",
    "If applicable, select any more specific feelings you may be having"
  );

  currentEmotionData.nuancedEmotions.forEach((nuEmotion) => {
    const cb = createCheckbox(nuEmotion, nuancedEmotionsGroupDiv);
    cb.dataset.type = "nuanced";
    cb.dataset.emotion = emotion;
    if (selections.nuanced[emotion].includes(nuEmotion)) cb.checked = true;
  });

  appendHTML(emotionContainer,'br');
  appendHTML(emotionContainer,'h3', `${emotion} often indicates a need for ${currentEmotionData.coreNeed}. I will try... [optional] `);

  const nuancedNeedsGroupDiv = appendHTML(emotionContainer,'div');
  nuancedNeedsGroupDiv.setAttribute(
    'aria-label',
    'If applicable, select any more specific needs you may have'
  );

  currentEmotionData.nuancedNeeds.forEach((nuNeed) => {
    const cb = createCheckbox(nuNeed, nuancedNeedsGroupDiv, true);
    cb.dataset.type = "need";
    cb.dataset.emotion = emotion;
    if (selections.needs[emotion].includes(nuNeed)) cb.checked = true;
  });

  nextEmotionBtn.textContent =
    currentEmotionIndex < selections.emotions.length - 1
      ? "Next Emotion"
      : "See Summary";
  setTimeout(() => emotionContainer.focus());
}

function saveCurrentSelections() {
  const emotion = selections.emotions[currentEmotionIndex];
  selections.nuanced[emotion] = Array.from(
    document.querySelectorAll(
      `input[data-type='nuanced'][data-emotion='${emotion}']:checked`
    )
  ).map((cb) => cb.value);
  selections.needs[emotion] = Array.from(
    document.querySelectorAll(
      `input[data-type='need'][data-emotion='${emotion}']:checked`
    )
  ).map((cb) => cb.value);
}

nextEmotionBtn.addEventListener("click", () => {
  saveCurrentSelections();
  if (currentEmotionIndex < selections.emotions.length - 1) {
    currentEmotionIndex++;
    renderEmotion();
  } else {
    step2.classList.add("hidden");
    step3.classList.remove("hidden");
    renderSummary();
  }
});

prevEmotionBtn.addEventListener("click", () => {
  saveCurrentSelections();
  if (currentEmotionIndex > 0) {
    currentEmotionIndex--;
    renderEmotion();
  } else {
    step2.classList.add("hidden");
    step1.classList.remove("hidden");
    setTimeout(()=>sensationsContainer.focus());
  }
});

function renderSummary() {
  saveCurrentSelections();
  summaryContainer.innerHTML = "";

  const selectedSensations = selections.sensations;
  const selectedNuanced = selections.nuanced;
  const selectedNeeds = selections.needs;

  if (
    !(
      selectedSensations.length ||
      Object.values(selectedNuanced).flat().length ||
      Object.values(selectedNeeds).flat().length
    )
  ) {
    summaryContainer.innerHTML = `<h2>You did not select anything. Go back to previous emotion/s or refresh page to start over.</h2>`;
    return;
  }

  let h2 = appendHTML(summaryContainer,'h2','Overall I feel...');

  selections.emotions.forEach((emotion) => {
    const emotionSensations = [...selectedSensations].filter(
      (sensation) => sensationEmotions[sensation] === emotion
    );
    const nuancedEmotions = selectedNuanced[emotion];
    const emotionNeeds = selectedNeeds[emotion];

    if (
      !(
        emotionSensations.length ||
        emotionNeeds.length ||
        nuancedEmotions.length
      )
    ) {
      return;
    }

    appendHTML(summaryContainer,'br');
    appendHTML(summaryContainer, 'h3', `Core Emotion: ${emotion}`);

    let sensationText;
    if (emotionSensations.length > 0) {
      sensationText = `I notice <b>${emotionSensations.join(', ')}</b>.`;
    } else {
      sensationText = `Sensations of ${emotion} can include ${emotionData[emotion].sensations.join(', ')}.`
    }

    appendHTML(summaryContainer,'p',sensationText);

    let nuancedText;
    if (nuancedEmotions.length > 0) {
      nuancedText = `Specifically, I feel <b>${nuancedEmotions.join(', ')}</b>.`;
    } else {
      nuancedText = 'No specific feelings selected.';
    }

    appendHTML(summaryContainer,'p',nuancedText);
    appendHTML(summaryContainer,'p', `I need <b>${emotionData[emotion].coreNeed}</b>:`);

    if (emotionNeeds.length > 0) {
      emotionNeeds.forEach((need) => {
        createCheckbox(need, summaryContainer, true);
      });
    } else {
      createCheckbox('No specific needs selected.', summaryContainer);
      appendHTML(summaryContainer,'br');
    }
  });

  setTimeout(()=>h2.focus());
}

step3BackBtn.addEventListener('click', () => {
  step3.classList.add('hidden');
  if (selections.emotions.length === 0) {
    step1.classList.remove('hidden');
  } else {
    step2.classList.remove('hidden');
  }
});

copySummaryBtn.addEventListener('click', () => {
  const summaryText = document.getElementById('summaryContainer').innerText;
  navigator.clipboard
    .writeText(summaryText)
    .then(() => {
      console.log('Summary copied to clipboard!');
    })
    .catch((err) => {
      console.error('Failed to copy text: ', err);
    });
});

loadDataset();
