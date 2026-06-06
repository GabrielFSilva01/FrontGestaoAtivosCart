import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div 
      [class]="'skeleton-base ' + className()" 
      [style.width]="width()" 
      [style.height]="height()" 
      [style.borderRadius]="radius()">
    </div>
  `,
  styles: [`
    .skeleton-base {
      display: block;
      width: 100%;
      background: linear-gradient(
        90deg, 
        rgba(229, 231, 235, 1) 25%, 
        rgba(243, 244, 246, 1) 50%, 
        rgba(229, 231, 235, 1) 75%
      );
      background-size: 200% 100%;
      animation: skeleton-loading 1.6s ease-in-out infinite;
    }
    
    @keyframes skeleton-loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    /* Suporte a tema escuro */
    @media (prefers-color-scheme: dark) {
      .skeleton-base {
        background: linear-gradient(
          90deg, 
          rgba(55, 65, 81, 1) 25%, 
          rgba(75, 85, 99, 1) 50%, 
          rgba(55, 65, 81, 1) 75%
        );
        background-size: 200% 100%;
      }
    }
  `]
})
export class SkeletonComponent {
  width = input<string>('100%');
  height = input<string>('1rem');
  radius = input<string>('0.375rem');
  className = input<string>('', { alias: 'class' });
}
