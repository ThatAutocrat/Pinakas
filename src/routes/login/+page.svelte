<script>
  import { enhance } from '$app/forms';
  import { fly } from 'svelte/transition';
  let { form } = $props();

  import { onMount } from 'svelte';

  const stories = [
    {
      emoji: '🗂️',
      title: 'Your team\'s second brain',
      desc: 'Organize every project, task, and deadline in one place. No more lost Slack messages or forgotten to-dos.'
    },
    {
      emoji: '⚡',
      title: 'Boards that move as fast as you do',
      desc: 'Drag tasks across columns, assign teammates, and watch progress happen in real time.'
    },
    {
      emoji: '🌸',
      title: 'React to work like an anime fan',
      desc: 'Drop a 🔥 Sugoi! on a finished task or a 😭 Nani?! on a blocker. Work should have personality.'
    },
    {
      emoji: '📅',
      title: 'Never miss a deadline again',
      desc: 'A calendar that shows every due date across all your projects at a glance.'
    },
    {
      emoji: '🔗',
      title: 'Invite your team in one click',
      desc: 'Send an invite link. They join, they see everything. No setup, no onboarding calls.'
    }
  ];

  let current = $state(0);

  const allTasks = [
    { id: 0, title: 'Design onboarding flow', tag: 'Design', emoji: '🎉' },
    { id: 1, title: 'Fix login edge cases',   tag: 'Bug',    emoji: '😤' },
    { id: 2, title: 'Write API docs',          tag: 'Backend',emoji: '💪' },
    { id: 3, title: 'User research tasks',     tag: 'Research',emoji: '🌸' },
    { id: 4, title: 'Set up CI/CD pipeline',  tag: 'Backend',emoji: '⚡' },
    { id: 5, title: 'Accessibility audit',     tag: 'Design', emoji: '🔍' },
  ];

  const COLS = ['To do', 'In progress', 'Done'];
  let taskCols = $state([0, 1, 2, 0, 1, 2]);

  const fakeTasks = [
    { title: 'Design onboarding flow', status: 'Done',        tag: 'Design',  emoji: '🎉' },
    { title: 'Fix login edge cases',   status: 'In progress', tag: 'Bug',     emoji: '😤' },
    { title: 'Write API docs',         status: 'To do',       tag: 'Backend', emoji: '💪' },
    { title: 'User research interviews',status:'Done',         tag: 'Research',emoji: '🌸' },
  ];

  const tagColors = {
    Design:   { bg: '#E6F1FB', c: '#0C447C' },
    Bug:      { bg: '#FCEBEB', c: '#791F1F' },
    Backend:  { bg: '#F1EFE8', c: '#444441' },
    Research: { bg: '#FAEEDA', c: '#633806' },
  };
  const statusDot = { Done: '#639922', 'In progress': '#EF9F27', 'To do': '#378ADD' };

  const testimonials = [
    {
      quote: "We replaced three tools with Pinakas. Our standups went from 40 minutes to 12.",
      name: "Harshita",
      role: "Engineering Lead",
      avatar: "PM",
      color: "#E6F1FB",
      textColor: "#0C447C"
    },
    {
      quote: "The emoji reactions sound silly until you've used them. Now our team would riot without them.",
      name: "James",
      role: "Grocery Store",
      avatar: "JK",
      color: "#EAF3DE",
      textColor: "#27500A"
    },
    {
      quote: "I set it up in 20 minutes and had my whole team onboarded by lunch. Zero onboarding calls.",
      name: "Sofia Rodriguez",
      role: "Founder",
      avatar: "SR",
      color: "#FAEEDA",
      textColor: "#633806"
    }
  ];

  const features = [
    { icon: '🗂️', label: 'Kanban boards', desc: 'Drag-and-drop tasks across custom columns' },
    { icon: '📅', label: 'Calendar view', desc: 'See all deadlines across every project' },
    { icon: '🔥', label: 'Emoji reactions', desc: 'Express yourself on any task or update' },
    { icon: '🔗', label: 'Instant invites', desc: 'One link, zero friction team onboarding' },
    { icon: '🔔', label: 'Smart alerts', desc: 'Only get notified when it actually matters' },
    { icon: '📊', label: 'Team analytics', desc: 'See velocity, blockers, and output over time' },
  ];

  const typingLines = [
    'Ship features faster.',
    'Kill the status meeting.',
    'Async by default.',
    'Built for your team.',
  ];

  let typedText = $state('');
  let lineIndex = $state(0);
  let charIndex = $state(0);
  let deleting = $state(false);
  let currentPanel = $state(0);
  let showPassword = $state(false);
  let cardVisible = $state(false);
  let submitting = $state(false);

  onMount(() => {
    setTimeout(() => { cardVisible = true; }, 60);

    const storyInterval = setInterval(() => {
      current = (current + 1) % stories.length;
    }, 3500);

    const typeInterval = setInterval(() => {
      const line = typingLines[lineIndex];
      if (!deleting) {
        typedText = line.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === line.length) deleting = true;
      } else {
        typedText = line.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          lineIndex = (lineIndex + 1) % typingLines.length;
        }
      }
    }, 80);

    const kanbanInterval = setInterval(() => {
      const idx = Math.floor(Math.random() * allTasks.length);
      taskCols = taskCols.map((col, i) => i === idx ? (col + 1) % 3 : col);
    }, 1400);

    const scroller = document.getElementById('story-scroller');
    const onScroll = () => {
      if (scroller) currentPanel = Math.round(scroller.scrollTop / scroller.clientHeight);
    };
    scroller?.addEventListener('scroll', onScroll);

    return () => {
      clearInterval(storyInterval);
      clearInterval(typeInterval);
      clearInterval(kanbanInterval);
      scroller?.removeEventListener('scroll', onScroll);
    };
  });

  function scrollToPanel(i) {
    const scroller = document.getElementById('story-scroller');
    if (scroller) scroller.scrollTo({ top: i * scroller.clientHeight, behavior: 'smooth' });
  }
</script>

<svelte:head>
  <title>Login — Pinakas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Shippori+Mincho:wght@700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="page">
  <!-- Left: login form -->
  <div class="form-side">

    <!-- Cursive pinakas marquee ring -->
    <div class="ring-wrapper" aria-hidden="true">
      <svg class="ring-svg" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="ring-path" d="M 300,300 m -230,0 a 230,230 0 1,1 460,0 a 230,230 0 1,1 -460,0" />
        </defs>
        <text class="ring-text">
          <textPath href="#ring-path" startOffset="0%">
            pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦ pinakas ✦
          </textPath>
        </text>
      </svg>
    </div>

    <!-- Katakana heading + card stacked -->
    <div class="form-content" class:form-visible={cardVisible}>
      <div class="jp-heading">
        <div class="jp-title">ピナカス</div>
        <div class="jp-sub">pinakas</div>
      </div>

      <div class="card">
        <p class="subtitle">Sign in to your workspace</p>

        {#if form?.error}
          <div class="error-box">{form.error}</div>
        {/if}

        <form method="POST" use:enhance={() => { submitting = true; return ({ update }) => { submitting = false; update(); }; }}>
          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" required autocomplete="email" />
          </label>
          <label>
            Password
            <div class="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                class="eye-btn"
                onclick={() => showPassword = !showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {#if showPassword}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                {:else}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                {/if}
              </button>
            </div>
          </label>
          <button type="submit" class="submit-btn" disabled={submitting}>
            {#if submitting}<span class="btn-spinner"></span>{/if}
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p class="switch">Don't have an account? <a href="/register">Create one</a></p>
      </div>
    </div>
  </div>

  <!-- Right: scrollable story panels -->
  <div class="story-side">
    <div class="panel-nav">
      {#each [0, 1, 2, 3] as i}
        <button class="panel-dot" class:active={currentPanel === i} onclick={() => scrollToPanel(i)} aria-label="Go to panel {i + 1}"></button>
      {/each}
    </div>

    <div class="story-scroller" id="story-scroller">

      <!-- Panel 1 -->
      <div class="panel panel-1">
        <div class="story-card">
          <div class="story-emoji">{stories[current].emoji}</div>
          <div class="story-title">{stories[current].title}</div>
          <div class="story-desc">{stories[current].desc}</div>
          <div class="story-dots">
            {#each stories as _, i}
              <button class="dot" class:active={i === current} onclick={() => current = i} aria-label="Go to slide {i + 1}"></button>
            {/each}
          </div>
        </div>
        <div class="preview-label">What it looks like inside →</div>
        <div class="mini-board">
          {#each fakeTasks.slice(0, 4) as task}
            <div class="mini-card">
              <div class="mini-top">
                <span class="mini-tag" style="background:{tagColors[task.tag].bg};color:{tagColors[task.tag].c}">{task.tag}</span>
                <span class="mini-reaction">{task.emoji}</span>
              </div>
              <div class="mini-title">{task.title}</div>
              <div class="mini-status">
                <span class="mini-dot" style="background:{statusDot[task.status]}"></span>
                {task.status}
              </div>
            </div>
          {/each}
        </div>
        <div class="tagline">Built for teams that move fast ⚡</div>
        <div class="scroll-hint">scroll for more ↓</div>
      </div>

      <!-- Panel 2: Kanban -->
      <div class="panel panel-2">
        <div class="panel-heading">
          <div class="panel-eyebrow">Live preview</div>
          <div class="panel-title">Watch work move</div>
          <div class="panel-sub">Your board, always in motion. Drag, assign, ship.</div>
        </div>
        <div class="kanban-board">
          {#each COLS as col, colIdx}
            <div class="kanban-col">
              <div class="kanban-col-header">
                <span class="kanban-col-dot" style="background:{statusDot[col]}"></span>
                {col}
                <span class="kanban-col-count">{taskCols.filter(c => c === colIdx).length}</span>
              </div>
              {#each allTasks.filter((_, i) => taskCols[i] === colIdx) as task (task.id)}
                <div class="kanban-task" in:fly={{ y: -18, duration: 320 }} out:fly={{ y: 18, duration: 260 }}>
                  <div class="kanban-task-top">
                    <span class="mini-tag" style="background:{tagColors[task.tag].bg};color:{tagColors[task.tag].c}">{task.tag}</span>
                    <span class="mini-reaction">{task.emoji}</span>
                  </div>
                  <div class="kanban-task-title">{task.title}</div>
                </div>
              {/each}
            </div>
          {/each}
        </div>
      </div>

      <!-- Panel 3: Testimonials -->
      <div class="panel panel-3">
        <div class="panel-heading">
          <div class="panel-eyebrow">Loved by teams</div>
          <div class="panel-title">Don't take our word for it</div>
        </div>
        <div class="testimonials">
          {#each testimonials as t, i}
            <div class="testimonial" style="animation-delay:{i * 0.12}s">
              <div class="testimonial-quote">"{t.quote}"</div>
              <div class="testimonial-author">
                <div class="testimonial-avatar" style="background:{t.color};color:{t.textColor}">{t.avatar}</div>
                <div>
                  <div class="testimonial-name">{t.name}</div>
                  <div class="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Panel 4: Features + typing -->
      <div class="panel panel-4">
        <div class="typing-headline">
          <span>{typedText}</span><span class="cursor">|</span>
        </div>
        <div class="features-grid">
          {#each features as f, i}
            <div class="feature-item" style="animation-delay:{i * 0.08}s">
              <div class="feature-icon">{f.icon}</div>
              <div class="feature-label">{f.label}</div>
              <div class="feature-desc">{f.desc}</div>
            </div>
          {/each}
        </div>
        <div class="cta-row">
          <div class="cta-badge">✦ Free tier &nbsp;·&nbsp; No card required ✦</div>
        </div>
      </div>

    </div>
  </div>
</div>

<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  /* ── Left ── */
  .form-side {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f7f7f5;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  /* Cursive ring */
  .ring-wrapper {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .ring-svg {
    width: 600px;
    height: 600px;
    animation: ring-spin 30s linear infinite;
    flex-shrink: 0;
  }
  .ring-text {
    font-family: 'Dancing Script', 'Brush Script MT', cursive;
    font-size: 22px;
    fill: rgba(59, 109, 17, 0.18);
    letter-spacing: 0.06em;
  }
  @keyframes ring-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* heading + card wrapper */
  .form-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
    max-width: 380px;
    position: relative;
    z-index: 1;
    opacity: 0;
    transform: translateY(22px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .form-content.form-visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Katakana heading */
  .jp-heading {
    text-align: center;
  }
  .jp-title {
    font-family: 'Shippori Mincho', serif;
    font-size: 2.8rem;
    font-weight: 700;
    color: #1a1a18;
    line-height: 1;
    letter-spacing: 0.08em;
  }
  .jp-sub {
    font-size: 13px;
    color: #3B6D11;
    letter-spacing: 0.25em;
    margin-top: 6px;
    font-weight: 500;
  }

  /* Card */
  .card {
    background: #fff;
    border: 0.5px solid #e5e4df;
    border-radius: 16px;
    padding: 2.5rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .subtitle { font-size: 13px; color: #6b6b65; }
  form { display: flex; flex-direction: column; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 5px; font-size: 13px; font-weight: 500; color: #6b6b65; }

  input {
    padding: 9px 12px;
    border: 0.5px solid #c8c7c0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    width: 100%;
    background: #fff;
    color: #1a1a18;
  }
  input:focus { border-color: #3B6D11; box-shadow: 0 0 0 3px rgba(59,109,17,0.1); }

  .password-wrap { position: relative; display: flex; align-items: center; }
  .password-wrap input { padding-right: 38px; }
  .eye-btn {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    cursor: pointer;
    color: #aaa;
    padding: 0;
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }
  .eye-btn:hover { color: #3B6D11; }

  .submit-btn {
    background: #3B6D11; color: #fff; border: none;
    border-radius: 8px; padding: 10px; font-size: 14px;
    font-weight: 500; cursor: pointer; font-family: inherit; width: 100%;
    transition: background 0.2s;
  }
  .submit-btn:hover { background: #27500A; }
  .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .btn-spinner { display:inline-block; width:12px; height:12px; border:1.5px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; vertical-align:middle; margin-right:4px; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .error-box { background: #FCEBEB; color: #791F1F; padding: 8px 12px; border-radius: 8px; font-size: 13px; }
  .switch { text-align: center; font-size: 13px; color: #6b6b65; }
  .switch a { color: #3B6D11; font-weight: 500; }

  /* ── Right ── */
  .story-side {
    background: linear-gradient(135deg, #1a2e0a 0%, #0f1f06 50%, #0a1804 100%);
    position: relative;
    overflow: hidden;
  }

  .story-scroller {
    height: 100vh;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scrollbar-width: none;
  }
  .story-scroller::-webkit-scrollbar { display: none; }

  .panel-nav {
    position: absolute;
    right: 1.2rem;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .panel-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.25);
    border: none; cursor: pointer;
    padding: 0;
    transition: all 0.3s;
  }
  .panel-dot.active { background: #639922; height: 20px; border-radius: 3px; }

  .panel {
    height: 100vh;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3.5rem 2rem 2.5rem;
    gap: 1.2rem;
    position: relative;
  }
  .panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 20% 80%, rgba(99,153,34,0.13) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(99,153,34,0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  .scroll-hint {
    font-size: 11px;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.05em;
    position: absolute;
    bottom: 1.2rem;
    left: 50%;
    transform: translateX(-50%);
    animation: bounce 2s ease-in-out infinite;
  }
  @keyframes bounce {
    0%,100% { transform: translateX(-50%) translateY(0); }
    50%      { transform: translateX(-50%) translateY(4px); }
  }

  .story-card {
    background: rgba(255,255,255,0.06);
    border: 0.5px solid rgba(255,255,255,0.12);
    border-radius: 16px;
    padding: 1.75rem;
    width: 100%;
    max-width: 400px;
  }
  .story-emoji { font-size: 2.2rem; margin-bottom: 0.75rem; }
  .story-title { font-size: 1.2rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; line-height: 1.3; }
  .story-desc { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.7; }
  .story-dots { display: flex; gap: 6px; margin-top: 1.25rem; }
  .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.25); border: none; cursor: pointer;
    transition: all 0.3s; padding: 0;
  }
  .dot.active { background: #639922; width: 20px; border-radius: 3px; }

  .preview-label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; align-self: flex-start; }
  .mini-board { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; max-width: 400px; }
  .mini-card {
    background: rgba(255,255,255,0.07);
    border: 0.5px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.75rem;
    display: flex; flex-direction: column; gap: 6px;
  }
  .mini-top { display: flex; align-items: center; justify-content: space-between; }
  .mini-tag { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
  .mini-reaction { font-size: 14px; }
  .mini-title { font-size: 11px; color: rgba(255,255,255,0.85); font-weight: 500; line-height: 1.4; }
  .mini-status { display: flex; align-items: center; gap: 5px; font-size: 10px; color: rgba(255,255,255,0.4); }
  .mini-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .tagline { text-align: center; font-size: 13px; color: rgba(255,255,255,0.35); }

  .panel-heading { text-align: center; width: 100%; }
  .panel-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #639922; font-weight: 600; margin-bottom: 0.4rem; }
  .panel-title { font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; }
  .panel-sub { font-size: 13px; color: rgba(255,255,255,0.5); }

  .kanban-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 480px;
  }
  .kanban-col {
    background: rgba(255,255,255,0.05);
    border: 0.5px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    height: 290px;
    overflow: hidden;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .kanban-col-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding-bottom: 6px;
    border-bottom: 0.5px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }
  .kanban-col-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .kanban-col-count {
    margin-left: auto;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 1px 6px;
    font-size: 10px;
  }
  .kanban-task {
    background: rgba(255,255,255,0.07);
    border: 0.5px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 0.35rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex-shrink: 0;
  }
  .kanban-task-top { display: flex; align-items: center; justify-content: space-between; }
  .kanban-task-title { font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 500; line-height: 1.4; }

  .testimonials { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 400px; }
  .testimonial {
    background: rgba(255,255,255,0.06);
    border: 0.5px solid rgba(255,255,255,0.11);
    border-radius: 14px;
    padding: 1.1rem 1.25rem;
    animation: fadeSlideUp 0.5s ease both;
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .testimonial-quote {
    font-size: 13px;
    color: rgba(255,255,255,0.8);
    line-height: 1.65;
    margin-bottom: 0.9rem;
    font-style: italic;
  }
  .testimonial-author { display: flex; align-items: center; gap: 10px; }
  .testimonial-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
  }
  .testimonial-name { font-size: 12px; font-weight: 700; color: #fff; }
  .testimonial-role { font-size: 11px; color: rgba(255,255,255,0.4); }

  .typing-headline {
    font-size: 1.75rem;
    font-weight: 800;
    color: #fff;
    text-align: center;
    min-height: 2.2rem;
    line-height: 1.2;
  }
  .cursor {
    color: #639922;
    animation: blink 0.85s step-start infinite;
    font-weight: 300;
  }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 420px;
  }
  .feature-item {
    background: rgba(255,255,255,0.06);
    border: 0.5px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 0.9rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
    animation: fadeSlideUp 0.4s ease both;
  }
  .feature-icon { font-size: 1.3rem; margin-bottom: 2px; }
  .feature-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.9); }
  .feature-desc { font-size: 10px; color: rgba(255,255,255,0.45); line-height: 1.5; }

  .cta-row { display: flex; justify-content: center; }
  .cta-badge {
    font-size: 11px;
    color: #639922;
    border: 0.5px solid rgba(99,153,34,0.35);
    border-radius: 20px;
    padding: 6px 16px;
    letter-spacing: 0.04em;
  }

  @media (max-width: 768px) {
    .page { grid-template-columns: 1fr; }
    .story-side { display: none; }
  }
</style>