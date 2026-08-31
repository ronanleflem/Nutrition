import { ShellChromeService } from './shell-chrome.service';

describe('ShellChromeService', () => {
  it('toggles chrome visibility', () => {
    const service = new ShellChromeService();

    expect(service.hidden()).toBe(false);

    service.setHidden(true);
    expect(service.hidden()).toBe(true);

    service.setHidden(false);
    expect(service.hidden()).toBe(false);
  });
});
