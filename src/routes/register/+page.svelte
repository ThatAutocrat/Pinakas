<script>
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import emailjs from '@emailjs/browser';
  let { form } = $props();
  let submitting = $state(false);

  let nameVal = $state('');
  let emailVal = $state('');

  let activeField = $state(null);
  let bubbleTop = $state(0);

  const bubbleMessages = {
    name:     { text: "By what moniker shall you be known? 👀", emoji: "✨" },
    email:    { text: "We only slide into your emails with purpose. 🌸",    emoji: "💌" },
    password: { text: "Make it unhackable  🙈",          emoji: "🔒" },
  };

  function focusField(field, e) {
    activeField = field;
    const input = e.target;
    const formWrap = input.closest('.form-wrap');
    const wrapRect = formWrap.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    bubbleTop = inputRect.top - wrapRect.top + inputRect.height / 2;
  }
  function blurField() { activeField = null; }
</script>

<svelte:head><title>Create account — Pinakas</title></svelte:head>

<div class="page">

  <svg class="bg-svg" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    {#each Array(30) as _, i}
      <circle
        cx={((i * 137.5) % 1200)}
        cy={((i * 97.3) % 800)}
        r={i % 3 === 0 ? 2 : 1.2}
        fill="#639922"
        opacity={0.15 + (i % 5) * 0.05}
      />
    {/each}
    {#each [[120,180],[980,120],[200,620],[1050,500],[600,700],[350,80],[850,650]] as [x,y], i}
      <g transform="translate({x},{y})" class="sparkle" style="animation-delay:{i*0.4}s">
        <line x1="0" y1="-8" x2="0" y2="8" stroke="#639922" stroke-width="1.5" opacity="0.3"/>
        <line x1="-8" y1="0" x2="8" y2="0" stroke="#639922" stroke-width="1.5" opacity="0.3"/>
        <line x1="-5" y1="-5" x2="5" y2="5" stroke="#639922" stroke-width="1" opacity="0.2"/>
        <line x1="5" y1="-5" x2="-5" y2="5" stroke="#639922" stroke-width="1" opacity="0.2"/>
      </g>
    {/each}
    <circle cx="150" cy="650" r="120" fill="#639922" opacity="0.04"/>
    <circle cx="1080" cy="150" r="100" fill="#378ADD" opacity="0.04"/>
    <circle cx="600" cy="750" r="80"  fill="#D4537E" opacity="0.03"/>
    {#each [[80,300],[1100,400],[300,720],[900,680],[500,60]] as [x,y], i}
      <circle cx={x} cy={y} r="4" fill="#639922" opacity="0.12" class="float-dot" style="animation-delay:{i*0.7}s"/>
    {/each}
  </svg>

  <div class="site-header">
    <div class="brand">
      <span class="brand-name">Pinakas</span>
      <span class="brand-katakana">ピナカス</span>
    </div>
    <a href="/login" class="signin-link">Already have an account? Sign in →</a>
  </div>

  <div class="hero-text">
    <h1 class="hero-title">Your team's<br/><span class="accent">command center.</span></h1>
    <p class="hero-sub">Tasks, boards, reactions, deadlines — all in one place.</p>
  </div>

  <div class="features-layout">

    <div class="features-left">
      <div class="feat-card">
        <div class="feat-icon">🗂️</div>
        <div class="feat-body">
          <div class="feat-title">Kanban Boards</div>
          <div class="feat-desc">Drag tasks across columns. Ship faster.</div>
        </div>
      </div>
      <div class="feat-card">
        <div class="feat-icon">📅</div>
        <div class="feat-body">
          <div class="feat-title">Calendar View</div>
          <div class="feat-desc">Every deadline across all projects.</div>
        </div>
      </div>
    </div>

    <div class="form-center">
      <div class="form-wrap">
        {#if activeField && bubbleMessages[activeField]}
          <div class="speech-bubble" style="top:{bubbleTop}px">
            <span class="bubble-emoji">{bubbleMessages[activeField].emoji}</span>
            <span class="bubble-text">{bubbleMessages[activeField].text}</span>
            <div class="bubble-tail"></div>
          </div>
        {/if}

        <div class="form-card">
          <div class="form-title">Create your account</div>

          {#if form?.error}
            <div class="error-box">{form.error}</div>
          {/if}

          <form
            method="POST"
            use:enhance={() => {
              submitting = true;
              return ({ update, result }) => {
                submitting = false;
                if (result.type === 'redirect') {
                  emailjs.send(
                    'service_gx6j3mi',
                    'template_iap4rwn',
                    { to_email: emailVal, name: nameVal },
                    'KWxoGc2E_RcA4A8N-'
                  );
                }
                update();
              };
            }}
          >
            <div class="form-group" class:active={activeField === 'name'}>
              <label for="name">Full name</label>
              <input type="text" id="name" name="name" placeholder="Aditya Kumar" required
                bind:value={nameVal}
                onfocus={(e) => focusField('name', e)} onblur={blurField} />
            </div>
            <div class="form-group" class:active={activeField === 'email'}>
              <label for="email">Email</label>
              <input type="email" id="email" name="email" placeholder="you@example.com" required
                bind:value={emailVal}
                onfocus={(e) => focusField('email', e)} onblur={blurField} />
            </div>
            <div class="form-group" class:active={activeField === 'password'}>
              <label for="password">Password</label>
              <input type="password" id="password" name="password" placeholder="Min. 8 characters" required
                onfocus={(e) => focusField('password', e)} onblur={blurField} />
            </div>
            <button type="submit" class="submit-btn" disabled={submitting}>
              {#if submitting}<span class="btn-spinner"></span>{/if}
              {submitting ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <p class="switch">Already have an account? <a href="/login">Sign in</a></p>
        </div>
      </div>
    </div>

    <div class="features-right">
      <div class="feat-card">
        <div class="feat-icon">🌸</div>
        <div class="feat-body">
          <div class="feat-title">Anime Reactions</div>
          <div class="feat-desc">React to tasks with 🔥 Sugoi! and more.</div>
        </div>
      </div>
      <div class="feat-card">
        <div class="feat-icon">🔗</div>
        <div class="feat-body">
          <div class="feat-title">Invite Links</div>
          <div class="feat-desc">One link. Team joins instantly.</div>
        </div>
      </div>
    </div>

  </div>

  <div class="bottom-feature">
    <div class="bottom-feat-card">
      <span class="feat-icon">🔍</span>
      <span class="feat-title">Global Search</span>
      <span class="feat-desc">— Find any task or project with ⌘K</span>
    </div>
  </div>

</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    background: #f7f7f2;
    font-family: 'DM Sans', system-ui, sans-serif;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .bg-svg {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }
  .sparkle { animation: sparkle-pulse 3s ease-in-out infinite; }
  @keyframes sparkle-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.7)} }
  .float-dot { animation: float-up 4s ease-in-out infinite; }
  @keyframes float-up { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

  .site-header {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 1100px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
  }
  .brand { display: flex; flex-direction: column; gap: 2px; }
  .brand-name { font-size: 1.3rem; font-weight: 800; color: #1a1a18; letter-spacing: -0.02em; }
  .brand-katakana { font-size: 11px; color: #639922; letter-spacing: 0.15em; font-weight: 500; }
  .signin-link { font-size: 13px; color: #6b6b65; text-decoration: none; }
  .signin-link:hover { color: #3B6D11; }

  .hero-text {
    position: relative;
    z-index: 10;
    text-align: center;
    margin-bottom: 2rem;
  }
  .hero-title { font-size: 2.2rem; font-weight: 800; color: #1a1a18; line-height: 1.2; letter-spacing: -0.03em; }
  .accent { color: #3B6D11; }
  .hero-sub { font-size: 14px; color: #6b6b65; margin-top: 0.5rem; }

  .features-layout {
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-columns: 220px 1fr 220px;
    gap: 1.5rem;
    width: 100%;
    max-width: 1000px;
    padding: 0 1.5rem;
    align-items: center;
  }

  .features-left, .features-right { display: flex; flex-direction: column; gap: 12px; }
  .feat-card {
    background: #fff;
    border: 0.5px solid #e5e4df;
    border-radius: 14px;
    padding: 1rem 1.1rem;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .feat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
  .feat-icon { font-size: 1.4rem; flex-shrink: 0; }
  .feat-title { font-size: 13px; font-weight: 600; color: #1a1a18; margin-bottom: 3px; }
  .feat-desc { font-size: 12px; color: #6b6b65; line-height: 1.5; }

  .form-center { display: flex; justify-content: center; }
  .form-wrap { position: relative; display: flex; align-items: flex-start; }

  .speech-bubble {
    position: absolute;
    left: -210px;
    top: 0;
    transform: translateY(-50%);
    background: #fff;
    border: 1.5px solid #639922;
    border-radius: 14px;
    padding: 10px 14px;
    width: 190px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 20px rgba(99,153,34,0.15);
    animation: bubble-pop 0.25s cubic-bezier(0.34,1.56,0.64,1);
    transition: top 0.3s cubic-bezier(0.34,1.56,0.64,1);
    z-index: 20;
  }
  .bubble-tail {
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 0; height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-left: 10px solid #639922;
  }
  .bubble-tail::after {
    content: '';
    position: absolute;
    right: 2px;
    top: -7px;
    width: 0; height: 0;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    border-left: 9px solid #fff;
  }
  .bubble-emoji { font-size: 1.1rem; flex-shrink: 0; }
  .bubble-text { font-size: 11px; font-weight: 500; color: #1a1a18; line-height: 1.4; }
  @keyframes bubble-pop {
    0%   { opacity:0; scale:0.7; }
    100% { opacity:1; scale:1; }
  }

  .form-card {
    background: #fff;
    border: 0.5px solid #e5e4df;
    border-radius: 18px;
    padding: 2rem 2rem;
    width: 340px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.08);
  }
  .form-title { font-size: 1rem; font-weight: 700; color: #1a1a18; margin-bottom: 1.25rem; }
  .error-box { background: #FCEBEB; color: #791F1F; padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 1rem; }
  .form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 0.9rem; transition: transform 0.2s; }
  .form-group.active { transform: translateX(4px); }
  .form-group.active label { color: #3B6D11; }
  label { font-size: 12px; font-weight: 600; color: #6b6b65; }
  input {
    padding: 9px 12px;
    border: 0.5px solid #ddddd8;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    background: #fff;
    color: #1a1a18;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  input:focus { border-color: #3B6D11; box-shadow: 0 0 0 3px rgba(59,109,17,0.08); }
  .submit-btn {
    width: 100%; background: #3B6D11; color: #fff;
    border: none; border-radius: 10px; padding: 11px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    font-family: inherit; margin-top: 0.25rem;
    transition: background 0.2s, transform 0.1s;
  }
  .submit-btn:hover { background: #27500A; transform: translateY(-1px); }
  .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
  .btn-spinner { display:inline-block; width:12px; height:12px; border:1.5px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; vertical-align:middle; margin-right:4px; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .switch { text-align: center; margin-top: 1rem; font-size: 12px; color: #6b6b65; }
  .switch a { color: #3B6D11; font-weight: 500; }

  .bottom-feature {
    position: relative;
    z-index: 10;
    margin-top: 1.5rem;
  }
  .bottom-feat-card {
    background: #fff;
    border: 0.5px solid #e5e4df;
    border-radius: 30px;
    padding: 0.65rem 1.5rem;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    font-size: 13px;
  }
  .bottom-feat-card .feat-title { font-weight: 600; color: #1a1a18; }
  .bottom-feat-card .feat-desc { color: #6b6b65; }
</style>
