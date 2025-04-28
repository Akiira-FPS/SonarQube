<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="navbar">
      <nav>
        <RouterLink to="/all">All Stats</RouterLink>
        <RouterLink to="/frontvue">FrontVue</RouterLink>
        <RouterLink to="/myz">MYZ</RouterLink>
        <RouterLink to="/zde">ZDE</RouterLink>
        <RouterLink to="/zfw">ZFW</RouterLink>
        <RouterLink to="/zhb">ZHB</RouterLink>
        <RouterLink to="/zqm">ZQM</RouterLink>
        <RouterLink to="/zrp">ZRP</RouterLink>
        <RouterLink to="/zsa">ZSA</RouterLink>
        <RouterLink to="/zsi">ZSI</RouterLink>
        <RouterLink to="/zup">ZUP</RouterLink>
      </nav>
    </div>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: var(--color-navbar-background);
  border-bottom: 1px solid var(--color-border);
  z-index: 1000;
  transition: background-color 0.5s, border-color 0.5s;
}

.navbar {
  max-width: 100%;
  padding: 1rem 2rem;
  display: flex;
  justify-content: center;
  overflow-x: auto;
}

nav {
  display: flex;
  gap: 1rem;
  flex-wrap: nowrap;
}

nav a {
  color: var(--color-navbar-text);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: background-color 0.2s ease, color 0.5s;
  white-space: nowrap;
}

nav a.router-link-exact-active {
  border-bottom: 2px solid var(--color-accent);
}

nav a:hover {
  background-color: var(--color-background-soft);
  border-radius: 5px;
}

main {
  margin-top: 4.5rem;
  padding: 1rem;
}
</style>