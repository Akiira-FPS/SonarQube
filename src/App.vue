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
  background-color: #fff;
  border-bottom: 1px solid var(--color-border);
  z-index: 1000;
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
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

nav a.router-link-exact-active {
  border-bottom: 2px solid var(--color-accent);
}

nav a:hover {
  background-color: #f2f2f2;
  border-radius: 5px;
}

/* Push main content below navbar */
main {
  margin-top: 4.5rem;
  padding: 1rem;
}
</style>