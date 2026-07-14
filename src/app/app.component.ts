import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShoppingItem } from './models/shopping-item';
import { ShoppingListService } from './services/shopping-list.service';

type Panel = 'none' | 'paste' | 'item';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly list = inject(ShoppingListService);

  readonly panel = signal<Panel>('none');
  readonly draftName = signal('');
  readonly draftQty = signal(1);
  readonly draftPrice = signal<number | null>(null);
  readonly pasteText = signal('');
  readonly toast = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly filter = signal<'all' | 'pending' | 'done'>('all');
  readonly confirmClearAll = signal(false);

  readonly visibleItems = computed(() => {
    const items = this.list.items();
    const filter = this.filter();
    if (filter === 'pending') return items.filter((i) => !i.checked);
    if (filter === 'done') return items.filter((i) => i.checked);
    return items;
  });

  private toastTimer?: ReturnType<typeof setTimeout>;

  openPaste(): void {
    this.panel.set('paste');
  }

  openAdd(): void {
    this.editingId.set(null);
    this.draftName.set('');
    this.draftQty.set(1);
    this.draftPrice.set(null);
    this.panel.set('item');
  }

  openEdit(item: ShoppingItem): void {
    this.editingId.set(item.id);
    this.draftName.set(item.name);
    this.draftQty.set(item.quantity);
    this.draftPrice.set(item.unitPrice);
    this.panel.set('item');
  }

  closePanel(): void {
    this.panel.set('none');
  }

  saveItem(): void {
    const name = this.draftName().trim();
    if (!name) return;

    const id = this.editingId();
    if (id) {
      this.list.updateName(id, name);
      this.list.updateQuantity(id, this.draftQty());
      this.list.updateUnitPrice(id, this.draftPrice());
      this.showToast('Item actualizado');
    } else {
      this.list.addItem(name, this.draftQty(), this.draftPrice());
      this.showToast('Agregado a la lista');
    }

    this.closePanel();
  }

  importPaste(): void {
    const count = this.list.importFromText(this.pasteText());
    this.pasteText.set('');
    this.closePanel();
    this.showToast(
      count === 0
        ? 'No encontré ítems nuevos'
        : count === 1
          ? '1 ítem pegado'
          : `${count} ítems pegados`
    );
  }

  toggle(item: ShoppingItem): void {
    this.list.toggleChecked(item.id);
  }

  remove(item: ShoppingItem, event: Event): void {
    event.stopPropagation();
    this.list.removeItem(item.id);
    this.showToast('Eliminado');
  }

  askClearAll(): void {
    if (!this.list.items().length) return;
    this.confirmClearAll.set(true);
  }

  cancelClearAll(): void {
    this.confirmClearAll.set(false);
  }

  confirmClearAllAction(): void {
    this.confirmClearAll.set(false);
    this.list.clearAll();
    this.showToast('Lista vacía');
  }

  lineTotal(item: ShoppingItem): number | null {
    if (item.unitPrice == null) return null;
    return item.unitPrice * item.quantity;
  }

  private showToast(message: string): void {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2200);
  }
}
