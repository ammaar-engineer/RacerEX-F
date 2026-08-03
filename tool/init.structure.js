import fs from 'fs'
import path from 'path'

const ROOT = './src'

// Struktur folder dan file yang akan dibuat
const STRUCTURE = {
    'connection': [],
    'docs': [],
    'middleware': ['.gitkeep'],
    'modules': [],
    'types': [],
    'validations': [],
}

// Warna ANSI untuk terminal output
const color = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
}

function printTree(dir, prefix = '', isRoot = false) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => {
            // Folder dulu, baru file
            if (a.isDirectory() && !b.isDirectory()) return -1
            if (!a.isDirectory() && b.isDirectory()) return 1
            return a.name.localeCompare(b.name)
        })

    entries.forEach((entry, index) => {
        const isLast = index === entries.length - 1
        const connector = isLast ? '└── ' : '├── '
        const childPrefix = isLast ? '    ' : '│   '

        if (entry.isDirectory()) {
            console.log(`${prefix}${color.blue}${connector}${entry.name}/${color.reset}`)
            printTree(path.join(dir, entry.name), prefix + childPrefix)
        } else {
            const ext = path.extname(entry.name)
            const fileColor = ext === '.ts' ? color.cyan : ext === '.md' ? color.yellow : color.gray
            console.log(`${prefix}${connector}${fileColor}${entry.name}${color.reset}`)
        }
    })
}

function ensureStructure() {
    for (const [folder, files] of Object.entries(STRUCTURE)) {
        const folderPath = path.join(ROOT, folder)

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true })
        }

        for (const file of files) {
            const filePath = path.join(folderPath, file)
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, '')
            }
        }
    }
}

// === MAIN ===
if (!fs.existsSync(ROOT)) {
    fs.mkdirSync(ROOT, { recursive: true })
}

ensureStructure()

console.log(`${color.blue}src/${color.reset}`)
printTree(ROOT)
