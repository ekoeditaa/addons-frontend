import * as React from 'react';

import HeadLinks, { HeadLinksBase } from 'amo/components/HeadLinks';
import { CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX } from 'core/constants';
import {
  dispatchClientMetadata,
  getFakeConfig,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const render = ({
    store = dispatchClientMetadata().store,
    ...props
  } = {}) => {
    return shallowUntilTarget(
      <HeadLinks store={store} to="/foo" {...props} />,
      HeadLinksBase,
    );
  };

  it.each([CLIENT_APP_ANDROID, CLIENT_APP_FIREFOX])(
    'renders alternate links with hreflang for %s',
    (clientApp) => {
      const baseURL = 'https://example.org';
      const to = '/some-url';

      const _hrefLangs = ['fr', 'en-US'];
      const _config = getFakeConfig({ baseURL });
      const { store } = dispatchClientMetadata({ clientApp });

      const root = render({ _config, _hrefLangs, store, to });

      expect(root.find('link[rel="alternate"]')).toHaveLength(
        _hrefLangs.length,
      );
      _hrefLangs.forEach((locale, index) => {
        expect(root.find('link[rel="alternate"]').at(index)).toHaveProp(
          'hrefLang',
          locale,
        );
        expect(root.find('link[rel="alternate"]').at(index)).toHaveProp(
          'href',
          `${baseURL}/${locale}/${clientApp}${to}`,
        );
      });
    },
  );

  it('renders alternate links for aliased locales', () => {
    const baseURL = 'https://example.org';
    const clientApp = CLIENT_APP_FIREFOX;
    const to = '/some-url';

    const _hrefLangs = ['x-default'];
    const aliasKey = 'x-default';
    const aliasValue = 'en-US';
    const hrefLangsMap = {
      [aliasKey]: aliasValue,
    };

    const _config = getFakeConfig({ baseURL, hrefLangsMap });
    const { store } = dispatchClientMetadata({ clientApp });

    const root = render({ _config, _hrefLangs, store, to });

    expect(root.find('link[rel="alternate"]')).toHaveLength(_hrefLangs.length);
    expect(root.find('link[rel="alternate"]').at(0)).toHaveProp(
      'hrefLang',
      aliasKey,
    );
    expect(root.find('link[rel="alternate"]').at(0)).toHaveProp(
      'href',
      `${baseURL}/${aliasValue}/${clientApp}${to}`,
    );
  });

  it('does not render any links for unsupported alternate link locales', () => {
    const lang = 'fr';
    const _hrefLangs = [lang, 'en-US'];
    // We mark the current locale as excluded.
    const _config = getFakeConfig({ unsupportedHrefLangs: [lang] });
    const { store } = dispatchClientMetadata({ lang });

    const root = render({ _config, _hrefLangs, store });

    expect(root.find('link[rel="alternate"]')).toHaveLength(0);
  });

  it('always renders a "canonical" link', () => {
    const lang = 'fr';
    const _hrefLangs = [lang, 'en-US'];
    // We mark the current locale as excluded.
    const _config = getFakeConfig({ unsupportedHrefLangs: [lang] });
    const { store } = dispatchClientMetadata({ lang });

    const root = render({ _config, _hrefLangs, store });

    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
  });

  // This test case ensures the production configuration is taken into account.
  it.each([['x-default', 'en-US'], ['pt', 'pt-PT'], ['en', 'en-US']])(
    'renders a "%s" alternate link',
    (hrefLang, locale) => {
      const baseURL = 'https://example.org';
      const clientApp = CLIENT_APP_FIREFOX;
      const to = '/some-url';

      const _config = getFakeConfig({ baseURL });
      const { store } = dispatchClientMetadata({ clientApp });

      const root = render({ _config, store, to });

      expect(root.find(`link[hrefLang="${hrefLang}"]`)).toHaveProp(
        'href',
        `${baseURL}/${locale}/${clientApp}${to}`,
      );
    },
  );

  it('throws an invariant error when the `to` prop does not start with a slash', () => {
    expect(() => {
      render({ to: 'no-slash' });
    }).toThrow();
  });

  it('renders a canonical link tag', () => {
    const baseURL = 'https://example.org';
    const clientApp = CLIENT_APP_FIREFOX;
    const lang = 'de';
    const to = '/some-canonical-url';

    const _config = getFakeConfig({ baseURL });
    const { store } = dispatchClientMetadata({ clientApp, lang });

    const root = render({ _config, store, to });

    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
    expect(root.find('link[rel="canonical"]')).toHaveProp(
      'href',
      `${baseURL}/${lang}/${clientApp}${to}`,
    );
  });

  it('does not prepend the clientApp when prependClientApp prop is set to `false`', () => {
    const baseURL = 'https://example.org';
    const clientApp = CLIENT_APP_ANDROID;
    const lang = 'de';
    const to = '/some-url';

    const _hrefLangs = ['fr', 'en-US'];
    const _config = getFakeConfig({ baseURL });
    const { store } = dispatchClientMetadata({ clientApp, lang });

    const root = render({
      _config,
      _hrefLangs,
      prependClientApp: false,
      store,
      to,
    });

    expect(root.find('link[rel="canonical"]')).toHaveLength(1);
    expect(root.find('link[rel="canonical"]')).toHaveProp(
      'href',
      `${baseURL}/${lang}${to}`,
    );

    expect(root.find('link[rel="alternate"]')).toHaveLength(_hrefLangs.length);
    _hrefLangs.forEach((locale, index) => {
      expect(root.find('link[rel="alternate"]').at(index)).toHaveProp(
        'hrefLang',
        locale,
      );
      expect(root.find('link[rel="alternate"]').at(index)).toHaveProp(
        'href',
        `${baseURL}/${locale}${to}`,
      );
    });
  });
});
