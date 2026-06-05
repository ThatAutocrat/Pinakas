<script>
  import { enhance } from '$app/forms';
  let { data } = $props();
  let { invite, project, loggedIn, user } = $derived(data);
  let submitting = $state(false);
</script>

<svelte:head><title>Project Invite — Pinakas</title></svelte:head>

<div class="page">
  <div class="card">
    <div class="logo">pina<span>kas</span></div>
    <div class="project-badge" style="background:{project.color}22;border:1px solid {project.color}44">
      <span class="proj-dot" style="background:{project.color}"></span>
      {project.name}
    </div>
    <h2>You've been invited!</h2>
    <p>Join <strong>{project.name}</strong> on Pinakas to collaborate on tasks and projects.</p>
    <p class="invite-email">Invited to: <strong>{invite.email}</strong></p>

    {#if loggedIn}
      <form method="POST" action="?/accept" use:enhance={() => { submitting = true; return ({ update }) => { submitting = false; update(); }; }}>
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center" disabled={submitting}>
          {#if submitting}<span class="btn-spinner"></span>{:else}<i class="ti ti-check"></i>{/if}
          {submitting ? 'Joining...' : 'Accept & join project'}
        </button>
      </form>
      <p class="hint">Signed in as {user.email}</p>
    {:else}
      <a href="/login?redirect=/invite/{invite.token}" class="btn btn-primary" style="display:flex;justify-content:center">
        <i class="ti ti-login"></i> Sign in to accept
      </a>
      <a href="/register?redirect=/invite/{invite.token}" class="btn" style="display:flex;justify-content:center;margin-top:8px">
        <i class="ti ti-user-plus"></i> Create account
      </a>
    {/if}
  </div>
</div>

<style>
.page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); }
.card { background:var(--surface); border:0.5px solid var(--border); border-radius:16px; padding:2.5rem; width:100%; max-width:400px; display:flex; flex-direction:column; gap:1rem; }
.logo { font-size:1.4rem; font-weight:800; }
.logo span { color:var(--accent); }
.project-badge { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:500; width:fit-content; }
.proj-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
h2 { font-size:1.1rem; font-weight:700; margin:0; color:var(--text); }
p { font-size:13px; color:var(--muted); margin:0; line-height:1.6; }
.invite-email { background:var(--bg); border-radius:8px; padding:8px 12px; font-size:13px; color:var(--muted); }
.hint { font-size:11px; color:var(--hint); text-align:center; }
.btn-spinner { display:inline-block; width:12px; height:12px; border:1.5px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
