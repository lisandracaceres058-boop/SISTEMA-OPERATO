// Estado Global
const TOTAL_MEMORY = 1024;
let memoryMap = [
  {
    id: 1,
    isFree: true,
    size: TOTAL_MEMORY,
    processName: null,
  },
];
let nextId = 2;

// Funciones de Gestión de Memoria
function allocateProcess(name, size) {
  // Buscar primer bloque libre que sea >= al tamaño solicitado (First-fit)
  for (let i = 0; i < memoryMap.length; i++) {
    const block = memoryMap[i];
    if (block.isFree && block.size >= size) {
      // Si el bloque es exactamente del tamaño necesario
      if (block.size === size) {
        block.isFree = false;
        block.processName = name;
      } else {
        // Dividir el bloque
        const newBlock = {
          id: nextId++,
          isFree: true,
          size: block.size - size,
          processName: null,
        };

        block.isFree = false;
        block.size = size;
        block.processName = name;

        memoryMap.splice(i + 1, 0, newBlock);
      }
      return true;
    }
  }
  return false;
}

function freeProcess(id) {
  const block = memoryMap.find((b) => b.id === id);
  if (block && !block.isFree) {
    block.isFree = true;
    block.processName = null;
    coalesce();
    return true;
  }
  return false;
}

function coalesce() {
  let i = 0;
  while (i < memoryMap.length - 1) {
    const current = memoryMap[i];
    const next = memoryMap[i + 1];

    if (current.isFree && next.isFree) {
      // Fusionar bloques adyacentes libres
      current.size += next.size;
      memoryMap.splice(i + 1, 1);
      // No incrementar i para verificar si el siguiente bloque también está libre
    } else {
      i++;
    }
  }
}

function compactMemory() {
  // Separar bloques ocupados y libres
  const occupied = memoryMap.filter((block) => !block.isFree);
  const free = memoryMap.filter((block) => block.isFree);

  // Calcular espacio libre total
  const totalFree = free.reduce((sum, block) => sum + block.size, 0);

  // Reconstruir memoryMap con ocupados al principio y un solo bloque libre al final
  memoryMap = [...occupied];

  if (totalFree > 0) {
    memoryMap.push({
      id: nextId++,
      isFree: true,
      size: totalFree,
      processName: null,
    });
  }

  // Actualizar IDs para que sean consecutivos
  memoryMap.forEach((block, index) => {
    block.id = index + 1;
  });
  nextId = memoryMap.length + 1;
}

// Funciones de UI
function updateStatistics() {
  const used = memoryMap
    .filter((block) => !block.isFree)
    .reduce((sum, block) => sum + block.size, 0);
  const free = TOTAL_MEMORY - used;

  // Calcular fragmentación externa
  const freeBlocks = memoryMap.filter((block) => block.isFree);
  const fragmentation =
    freeBlocks.length > 1
      ? freeBlocks.reduce((sum, block) => sum + block.size, 0)
      : 0;

  document.getElementById("usedMemory").textContent = `${used} KB`;
  document.getElementById("freeMemory").textContent = `${free} KB`;
  document.getElementById("fragmentation").textContent = `${fragmentation} KB`;
}

function renderMemory() {
  const container = document.getElementById("memoryVisual");
  container.innerHTML = "";

  memoryMap.forEach((block, index) => {
    const blockElement = document.createElement("div");
    const heightPercentage = (block.size / TOTAL_MEMORY) * 100;

    blockElement.className = `memory-block ${block.isFree ? "free-block" : "occupied-block"} 
            rounded-lg p-2 mb-2 flex flex-col justify-center items-center relative`;
    blockElement.style.height = `${heightPercentage}%`;
    blockElement.style.minHeight = "30px";
    blockElement.dataset.blockId = block.id;

    if (block.isFree) {
      blockElement.innerHTML = `
                <div class="text-center">
                    <div class="text-xs text-gray-500 font-semibold">LIBRE</div>
                    <div class="text-xs text-gray-600">${block.size} KB</div>
                </div>
            `;
    } else {
      blockElement.innerHTML = `
                <button onclick="freeMemoryBlock(${block.id})" 
                    class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition">
                    ×
                </button>
                <div class="text-center text-white">
                    <div class="text-xs font-bold truncate max-w-full">${block.processName}</div>
                    <div class="text-xs opacity-90">${block.size} KB</div>
                </div>
            `;
    }

    container.appendChild(blockElement);
  });
}

function freeMemoryBlock(id) {
  if (freeProcess(id)) {
    renderMemory();
    updateStatistics();
  }
}

function compactMemoryWithAnimation() {
  // Añadir clase de animación
  const blocks = document.querySelectorAll(".memory-block");
  blocks.forEach((block) => block.classList.add("compacting"));

  setTimeout(() => {
    compactMemory();
    renderMemory();
    updateStatistics();
  }, 400);
}

// Función para mostrar mensajes
function showMessage(message, type) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-50 
        ${type === "success" ? "bg-green-500" : "bg-red-500"} 
        transform translate-x-full transition-transform duration-300`;
  messageDiv.textContent = message;

  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    messageDiv.style.transform = "translateX(110%)";
    setTimeout(() => {
      document.body.removeChild(messageDiv);
    }, 300);
  }, 3000);
}

// Event Listeners
document.getElementById("allocateBtn").addEventListener("click", () => {
  const name = document.getElementById("processName").value.trim();
  const size = parseInt(document.getElementById("processSize").value);

  if (!name) {
    showMessage("Por favor ingrese un nombre de proceso", "error");
    return;
  }

  if (!size || size <= 0 || size > TOTAL_MEMORY) {
    showMessage("Por favor ingrese un tamaño válido (1-1024 KB)", "error");
    return;
  }

  if (allocateProcess(name, size)) {
    renderMemory();
    updateStatistics();
    document.getElementById("processName").value = "";
    document.getElementById("processSize").value = "";
    showMessage(`Proceso "${name}" asignado exitosamente`, "success");
  } else {
    showMessage("No hay suficiente memoria contigua disponible", "error");
  }
});

document.getElementById("compactBtn").addEventListener("click", () => {
  compactMemoryWithAnimation();
  showMessage("Memoria compactada exitosamente", "success");
});

// Permitir Enter en los inputs
document.getElementById("processName").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("processSize").focus();
  }
});

document.getElementById("processSize").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("allocateBtn").click();
  }
});

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  renderMemory();
  updateStatistics();
});
