<template>
    <div class="date-range-picker">
        <div class="field">
            <label for="start" class="field-label">
                {{ single ? 'Date' : 'Date de début' }}
            </label>
            <DatePicker id="start" v-model="startDate" @update:modelValue="onDateChange" :showIcon="true"
                dateFormat="dd/mm/yy" class="date-input" :showOtherMonths="false" />
        </div>

        <div v-if="!single" class="field">
            <label for="end" class="field-label">Date de fin</label>
            <DatePicker id="end" v-model="endDate" @update:modelValue="onDateChange" :showIcon="true"
                dateFormat="dd/mm/yy" class="date-input" :showOtherMonths="false" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits(['update:range'])
const props = defineProps({
    single: {
        type: Boolean,
        default: false
    }
})

const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)

const onDateChange = () => {
    if (props.single) {
        emit('update:range', { start: startDate.value })
    } else {
        emit('update:range', {
            start: startDate.value,
            end: endDate.value
        })
    }
}

onMounted(() => {
    const today = new Date()
    if (props.single) {
        startDate.value = today
        onDateChange()
    } else {
        const lastYear = new Date()
        lastYear.setFullYear(today.getFullYear() - 1)
        startDate.value = lastYear
        endDate.value = today
        onDateChange()
    }
})
</script>

<style scoped>
.date-range-picker {
    display: flex;
    gap: 1rem;
    background: var(--color-background-mute);
    padding: 1.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    flex-wrap: wrap;
}

.field {
    display: flex;
    flex-direction: column;
    flex: 1 1 200px;
    min-width: 220px;
}

.field-label {
    font-size: 0.875rem;
    color: var(--color-heading);
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.date-input {
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    background-color: var(--color-background-soft);
    color: var(--color-text);
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.date-input:focus,
.date-input:focus-within {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px var(--color-border-hover);
}
</style>